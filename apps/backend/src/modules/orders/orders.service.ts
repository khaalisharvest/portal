import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Address } from './entities/address.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { CreateGuestOrderDto } from './dto/create-guest-order.dto';
import { SettingsService } from '../settings/services/settings.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    private settingsService: SettingsService,
  ) {}

  async calculateDeliveryFee(subtotal: number): Promise<{ deliveryFee: number; isFree: boolean; reason: string }> {
    const settings = await this.settingsService.getDeliverySettings();
    
    if (!settings.isDeliveryEnabled) {
      return { deliveryFee: 0, isFree: true, reason: 'Delivery is disabled' };
    }

    if (subtotal >= settings.freeDeliveryThreshold) {
      return { 
        deliveryFee: 0, 
        isFree: true, 
        reason: `Order amount (₨${subtotal}) meets free delivery threshold (₨${settings.freeDeliveryThreshold})` 
      };
    }

    return { 
      deliveryFee: settings.deliveryFee, 
      isFree: false, 
      reason: `Order amount (₨${subtotal}) is below free delivery threshold (₨${settings.freeDeliveryThreshold})` 
    };
  }

  async createOrder(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verify address belongs to user
      const address = await queryRunner.manager.findOne(Address, {
        where: { id: createOrderDto.addressId, userId },
        relations: ['user']
      });

      if (!address) {
        throw new NotFoundException('Address not found or does not belong to user');
      }

      // Verify products exist and are available
      const productIds = createOrderDto.items.map(item => item.productId);
      const uniqueProductIds = [...new Set(productIds)]; // Remove duplicates
      const products = await queryRunner.manager.find(Product, {
        where: { id: In(uniqueProductIds) },
        relations: ['category', 'productType']
      });

      if (products.length !== uniqueProductIds.length) {
        throw new BadRequestException('One or more products not found');
      }

      // Check product availability
      for (const product of products) {
        if (!product.isAvailable) {
          throw new BadRequestException(`Product ${product.name} is not available`);
        }
      }

      // Generate order number
      const orderNumber = await this.generateOrderNumber();

      // Calculate totals
      let subtotal = 0;
      const orderItems: OrderItem[] = [];

      for (const itemDto of createOrderDto.items) {
        const product = products.find(p => p.id === itemDto.productId);
        if (!product) continue;

        // Determine the price to use - variant price if selected, otherwise product price
        let unitPrice = product.price;
        let itemName = product.name;
        
        if (itemDto.selectedVariant && product.hasVariants && product.variants) {
          const selectedVariant = product.variants.find(v => v.name === itemDto.selectedVariant);
          if (selectedVariant) {
            unitPrice = itemDto.variantPrice || selectedVariant.price;
            itemName = `${product.name} - ${selectedVariant.name}`;
          }
        }

        const totalPrice = unitPrice * itemDto.quantity;
        subtotal += totalPrice;

        const orderItem = queryRunner.manager.create(OrderItem, {
          productId: product.id,
          itemName,
          itemImage: product.images?.[0] || '',
          unitPrice,
          quantity: itemDto.quantity,
          totalPrice,
          unit: product.unit,
          specifications: product.specifications,
          selectedVariant: itemDto.selectedVariant,
          variantPrice: itemDto.variantPrice,
          variantOriginalPrice: itemDto.variantOriginalPrice
        });

        orderItems.push(orderItem);
      }

      // Create order
      // Calculate delivery fee
      const deliveryCalculation = await this.calculateDeliveryFee(subtotal);
      
      const order = queryRunner.manager.create(Order, {
        orderNumber,
        userId,
        addressId: createOrderDto.addressId,
        subtotal,
        deliveryFee: deliveryCalculation.deliveryFee,
        discount: 0,
        totalAmount: Number(subtotal) + Number(deliveryCalculation.deliveryFee),
        paymentMethod: createOrderDto.paymentMethod,
        paymentStatus: PaymentStatus.PENDING,
        notes: createOrderDto.notes,
        status: OrderStatus.PENDING
      });

      const savedOrder = await queryRunner.manager.save(Order, order);

      // Save order items
      for (const item of orderItems) {
        item.orderId = savedOrder.id;
        await queryRunner.manager.save(OrderItem, item);
      }

      await queryRunner.commitTransaction();

      // Return order with relations
      return this.findOne(savedOrder.id, userId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(userId: string, page: number = 1, limit: number = 10, status?: OrderStatus): Promise<{ orders: Order[], total: number, totalPages: number }> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.address', 'address')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.userId = :userId', { userId })
      .orderBy('order.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    const [orders, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      orders,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findOne(id: string, userId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['address', 'items', 'user']
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if user owns the order or is admin
    if (order.userId !== userId) {
      // TODO: Add admin check here
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  async updateOrder(id: string, updateOrderDto: UpdateOrderDto, userId: string): Promise<Order> {
    const order = await this.findOne(id, userId);

    // Only allow certain updates based on current status
    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot update completed or cancelled order');
    }

    Object.assign(order, updateOrderDto);
    await this.orderRepository.save(order);

    return this.findOne(id, userId);
  }

  async cancelOrder(id: string, reason: string, userId: string): Promise<Order> {
    const order = await this.findOne(id, userId);

    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot cancel completed or already cancelled order');
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    order.cancellationReason = reason;

    await this.orderRepository.save(order);
    return this.findOne(id, userId);
  }

  // Address management
  async createAddress(userId: string, createAddressDto: CreateAddressDto): Promise<Address> {
    // If this is set as default, unset other default addresses
    if (createAddressDto.isDefault) {
      await this.addressRepository.update(
        { userId, isDefault: true },
        { isDefault: false }
      );
    }

    const address = this.addressRepository.create({
      ...createAddressDto,
      userId,
      state: createAddressDto.state || 'Punjab', // Default to Punjab for Pakistani app
      country: createAddressDto.country || 'Pakistan' // Default to Pakistan for Pakistani app
    });

    return this.addressRepository.save(address);
  }

  async getUserAddresses(userId: string): Promise<Address[]> {
    return this.addressRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' }
    });
  }

  async updateAddress(id: string, updateAddressDto: Partial<CreateAddressDto>, userId: string): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id, userId }
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // If setting as default, unset other defaults
    if (updateAddressDto.isDefault) {
      await this.addressRepository.update(
        { userId, isDefault: true },
        { isDefault: false }
      );
    }

    Object.assign(address, updateAddressDto);
    return this.addressRepository.save(address);
  }

  async deleteAddress(id: string, userId: string): Promise<void> {
    const address = await this.addressRepository.findOne({
      where: { id, userId }
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.addressRepository.remove(address);
  }

  // Admin methods
  async getAllOrders(page: number = 1, limit: number = 10, status?: OrderStatus, paymentStatus?: PaymentStatus): Promise<{ orders: Order[], total: number, totalPages: number }> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.address', 'address')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('order.user', 'user')
      .orderBy('order.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    if (paymentStatus) {
      queryBuilder.andWhere('order.paymentStatus = :paymentStatus', { paymentStatus });
    }

    const [orders, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      orders,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Dashboard statistics for admin
  async getDashboardStats() {
    // Fetch all data in parallel for better performance
    const [
      totalOrders,
      orders,
      totalRevenueResult,
      pendingOrders,
      completedOrders,
      totalProducts,
      topProducts,
      totalCustomers
    ] = await Promise.all([
      // Total orders count
      this.orderRepository.count(),
      
      // Recent orders (last 5)
      this.orderRepository.find({
        order: { createdAt: 'DESC' },
        take: 5,
        relations: ['user', 'items'],
        select: ['id', 'orderNumber', 'status', 'totalAmount', 'createdAt']
      }),
      
      // Total revenue (sum of all delivered orders)
      this.orderRepository
        .createQueryBuilder('order')
        .select('SUM(order.totalAmount)', 'total')
        .where('order.status = :status', { status: OrderStatus.DELIVERED })
        .getRawOne(),
      
      // Pending orders count
      this.orderRepository.count({ where: { status: OrderStatus.PENDING } }),
      
      // Completed orders count
      this.orderRepository.count({ where: { status: OrderStatus.DELIVERED } }),
      
      // Total products count
      this.productRepository.count({ where: { isAvailable: true } }),
      
      // Top products (first 5 available products)
      this.productRepository.find({
        where: { isAvailable: true },
        take: 5,
        relations: ['category'],
        select: ['id', 'name', 'price', 'unit', 'images', 'category']
      }),
      
      // Total customers count
      this.userRepository.count({ where: { role: 'customer' } })
    ]);

    const totalRevenue = totalRevenueResult?.total ? parseFloat(totalRevenueResult.total) : 0;

    return {
      totalOrders,
      totalRevenue,
      totalCustomers,
      totalProducts,
      pendingOrders,
      completedOrders,
      recentOrders: orders,
      topProducts
    };
  }

  async updateOrderStatus(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['address', 'items', 'user']
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    Object.assign(order, updateOrderDto);
    await this.orderRepository.save(order);

    return order;
  }

  async createGuestOrder(createGuestOrderDto: CreateGuestOrderDto): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      console.log('Creating guest order with data:', JSON.stringify(createGuestOrderDto, null, 2));
      // Verify products exist and are available
      const productIds = createGuestOrderDto.items.map(item => item.productId);
      const uniqueProductIds = [...new Set(productIds)]; // Remove duplicates
      const products = await queryRunner.manager.find(Product, {
        where: { id: In(uniqueProductIds) },
        relations: ['category', 'productType']
      });

      if (products.length !== uniqueProductIds.length) {
        throw new BadRequestException('One or more products not found');
      }

      // Check product availability
      for (const product of products) {
        if (!product.isAvailable) {
          throw new BadRequestException(`Product ${product.name} is not available`);
        }
      }

      // Generate order number
      const orderNumber = await this.generateOrderNumber();

      // Guest addresses don't have a userId (null)
      // Create guest address
      console.log('Creating guest address without userId');
      const guestAddress = queryRunner.manager.create(Address, {
        userId: null, // Guest addresses don't have a userId
        fullName: createGuestOrderDto.address.fullName,
        phone: createGuestOrderDto.address.phone,
        addressLine1: createGuestOrderDto.address.addressLine1,
        addressLine2: createGuestOrderDto.address.addressLine2,
        city: createGuestOrderDto.address.city,
        state: createGuestOrderDto.address.state,
        postalCode: createGuestOrderDto.address.postalCode,
        country: createGuestOrderDto.address.country,
        type: createGuestOrderDto.address.type as any || 'home',
        isDefault: true,
        instructions: createGuestOrderDto.address.instructions
      });

      console.log('Saving guest address...');
      const savedAddress = await queryRunner.manager.save(Address, guestAddress);
      console.log('Guest address saved with ID:', savedAddress.id);

      // Calculate totals
      let subtotal = 0;
      const orderItems: OrderItem[] = [];

      for (const itemDto of createGuestOrderDto.items) {
        const product = products.find(p => p.id === itemDto.productId);
        if (!product) continue;

        // Determine the price to use - variant price if selected, otherwise product price
        let unitPrice = product.price;
        let itemName = product.name;
        
        if (itemDto.selectedVariant && product.hasVariants && product.variants) {
          const selectedVariant = product.variants.find(v => v.name === itemDto.selectedVariant);
          if (selectedVariant) {
            unitPrice = itemDto.variantPrice || selectedVariant.price;
            itemName = `${product.name} - ${selectedVariant.name}`;
          }
        }

        const totalPrice = unitPrice * itemDto.quantity;
        subtotal += totalPrice;

        const orderItem = queryRunner.manager.create(OrderItem, {
          productId: product.id,
          itemName,
          itemImage: product.images?.[0] || '',
          unitPrice,
          quantity: itemDto.quantity,
          totalPrice,
          unit: product.unit,
          specifications: product.specifications,
          selectedVariant: itemDto.selectedVariant,
          variantPrice: itemDto.variantPrice,
          variantOriginalPrice: itemDto.variantOriginalPrice
        });

        orderItems.push(orderItem);
      }

      // Create order
      // Calculate delivery fee
      const deliveryCalculation = await this.calculateDeliveryFee(subtotal);
      
      const order = queryRunner.manager.create(Order, {
        orderNumber,
        userId: null, // Guest orders don't have a userId
        addressId: savedAddress.id,
        subtotal,
        deliveryFee: deliveryCalculation.deliveryFee,
        discount: 0,
        totalAmount: Number(subtotal) + Number(deliveryCalculation.deliveryFee),
        paymentMethod: createGuestOrderDto.paymentMethod,
        paymentStatus: PaymentStatus.PENDING,
        notes: createGuestOrderDto.notes,
        status: OrderStatus.PENDING
      });

      const savedOrder = await queryRunner.manager.save(Order, order);

      // Save order items
      for (const item of orderItems) {
        item.orderId = savedOrder.id;
        await queryRunner.manager.save(OrderItem, item);
      }

      await queryRunner.commitTransaction();

      // Return order with relations (directly fetch to avoid permission issues)
      const orderWithRelations = await queryRunner.manager.findOne(Order, {
        where: { id: savedOrder.id },
        relations: ['address', 'items', 'user']
      });

      return orderWithRelations;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Unified order creation method that handles both logged-in and guest users
   */
  async createUnifiedOrder(
    userId: string | null, 
    orderData: {
      addressId?: string;
      address?: any;
      items: any[];
      paymentMethod: string;
      notes?: string;
    }
  ): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let address: Address;
      let finalUserId: string;

      if (userId) {
        // Logged-in user: use existing address
        address = await queryRunner.manager.findOne(Address, {
          where: { id: orderData.addressId, userId },
          relations: ['user']
        });

        if (!address) {
          throw new NotFoundException('Address not found or does not belong to user');
        }
        finalUserId = userId;
      } else {
        // Guest user: create new address with null userId
        finalUserId = null;

        // Check if address data exists for guest users
        if (!orderData.address) {
          throw new BadRequestException('Address information is required for guest orders');
        }

        address = queryRunner.manager.create(Address, {
          userId: null, // Guest addresses don't have a userId
          fullName: orderData.address.fullName,
          phone: orderData.address.phone,
          addressLine1: orderData.address.addressLine1,
          addressLine2: orderData.address.addressLine2,
          city: orderData.address.city,
          state: orderData.address.state || 'Punjab', // Default to Punjab for Pakistani app
          postalCode: orderData.address.postalCode,
          country: orderData.address.country || 'Pakistan', // Default to Pakistan for Pakistani app
          type: orderData.address.type || 'home',
          isDefault: true,
          instructions: orderData.address.instructions
        });

        await queryRunner.manager.save(Address, address);
      }

      // Verify products exist and are available (unified logic)
      const productIds = orderData.items.map(item => item.productId);
      const uniqueProductIds = [...new Set(productIds)];
      const products = await queryRunner.manager.find(Product, {
        where: { id: In(uniqueProductIds) },
        relations: ['category', 'productType']
      });

      if (products.length !== uniqueProductIds.length) {
        throw new BadRequestException('One or more products not found');
      }

      // Check product availability
      for (const product of products) {
        if (!product.isAvailable) {
          throw new BadRequestException(`Product ${product.name} is not available`);
        }
      }

      // Generate order number
      const orderNumber = await this.generateOrderNumber();

      // Calculate totals
      let subtotal = 0;
      const orderItems: OrderItem[] = [];

      for (const itemDto of orderData.items) {
        const product = products.find(p => p.id === itemDto.productId);
        if (!product) continue;

        // Determine the price to use - variant price if selected, otherwise product price
        let unitPrice = product.price;
        let itemName = product.name;
        
        if (itemDto.selectedVariant && product.hasVariants && product.variants) {
          const selectedVariant = product.variants.find(v => v.name === itemDto.selectedVariant);
          if (selectedVariant) {
            unitPrice = itemDto.variantPrice || selectedVariant.price;
            itemName = `${product.name} - ${selectedVariant.name}`;
          }
        }

        const totalPrice = unitPrice * itemDto.quantity;
        subtotal += totalPrice;

        const orderItem = queryRunner.manager.create(OrderItem, {
          productId: product.id,
          itemName,
          itemImage: product.images?.[0] || '',
          unitPrice,
          quantity: itemDto.quantity,
          totalPrice,
          unit: product.unit,
          specifications: product.specifications,
          selectedVariant: itemDto.selectedVariant,
          variantPrice: itemDto.variantPrice,
          variantOriginalPrice: itemDto.variantOriginalPrice
        });

        orderItems.push(orderItem);
      }

      // Create order
      const deliveryCalculation = await this.calculateDeliveryFee(subtotal);
      
      const order = queryRunner.manager.create(Order, {
        orderNumber,
        userId: finalUserId,
        addressId: address.id,
        subtotal,
        deliveryFee: deliveryCalculation.deliveryFee,
        discount: 0,
        totalAmount: Number(subtotal) + Number(deliveryCalculation.deliveryFee),
        paymentMethod: orderData.paymentMethod as any,
        paymentStatus: PaymentStatus.PENDING,
        notes: orderData.notes,
        status: OrderStatus.PENDING
      });

      const savedOrder = await queryRunner.manager.save(Order, order);

      // Save order items
      for (const item of orderItems) {
        item.orderId = savedOrder.id;
        await queryRunner.manager.save(OrderItem, item);
      }

      await queryRunner.commitTransaction();
      return savedOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD-${dateStr}-${randomNum}`;
  }
}
