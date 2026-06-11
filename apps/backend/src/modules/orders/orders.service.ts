import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Address } from './entities/address.entity';
import { Product } from '../products/entities/product.entity';
import { Inventory } from '../products/entities/inventory.entity';
import { User } from '../users/entities/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { CreateGuestOrderDto } from './dto/create-guest-order.dto';
import { SettingsService } from '../settings/services/settings.service';
import { EmailService } from '../notifications/email.service';
import { orderConfirmationTemplate, adminNewOrderTemplate } from '../notifications/templates/order-confirmation.template';
import { orderStatusTemplate } from '../notifications/templates/order-status.template';
import { env } from '../../config/env';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

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
    private emailService: EmailService,
    @Optional() private activityService?: ActivityService,
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

        // Always use server-side price — never trust client-provided price
        let resolvedUnitPrice = product.price;
        let resolvedVariantPrice: number | undefined;
        let resolvedVariantOriginalPrice: number | undefined;
        let itemName = product.name;

        if (itemDto.selectedVariant && product.hasVariants && product.variants) {
          const selectedVariant = product.variants.find(v => v.name === itemDto.selectedVariant);
          if (selectedVariant) {
            resolvedUnitPrice = selectedVariant.price;
            resolvedVariantPrice = selectedVariant.price;
            resolvedVariantOriginalPrice = selectedVariant.originalPrice;
            itemName = `${product.name} - ${selectedVariant.name}`;
          }
        }

        const totalPrice = resolvedUnitPrice * itemDto.quantity;
        subtotal += totalPrice;

        const orderItem = queryRunner.manager.create(OrderItem, {
          productId: product.id,
          itemName,
          itemImage: product.images?.[0] || '',
          unitPrice: resolvedUnitPrice,
          quantity: itemDto.quantity,
          totalPrice,
          unit: product.unit,
          specifications: product.specifications,
          selectedVariant: itemDto.selectedVariant,
          variantPrice: resolvedVariantPrice,
          variantOriginalPrice: resolvedVariantOriginalPrice,
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

    // Release reserved inventory on cancellation
    const orderItems = await this.orderItemRepository.find({ where: { orderId: id } });
    for (const item of orderItems) {
      const inventory = await this.dataSource.manager.findOne(Inventory, {
        where: { productId: item.productId }
      });
      if (inventory && inventory.reservedQuantity > 0) {
        await this.dataSource.manager.update(Inventory, inventory.id, {
          reservedQuantity: () => `GREATEST("reservedQuantity" - ${item.quantity}, 0)`
        });
      }
    }

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
  async getAllOrders(page: number = 1, limit: number = 10, status?: OrderStatus, paymentStatus?: PaymentStatus, search?: string): Promise<{ orders: Order[], total: number, totalPages: number }> {
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

    // Search by order number (optimized for ORD-YYYYMMDD-XXXX format)
    if (search && search.trim()) {
      const searchTerm = search.trim();
      
      // Smart search strategy:
      // 1. If search starts with "ORD" or contains "-", use prefix search (can use index)
      // 2. If search is all digits (likely searching by date or suffix), use substring search
      // This handles: "ORD-20251114-9147", "ORD-20251114", "20251114", "9147"
      if (searchTerm.toUpperCase().startsWith('ORD') || searchTerm.includes('-')) {
        // Prefix search - can use index efficiently
        queryBuilder.andWhere('order.orderNumber ILIKE :search', { search: `${searchTerm}%` });
      } else if (/^\d+$/.test(searchTerm)) {
        // All digits - likely searching by date (20251114) or suffix (9147)
        // Use substring search for flexibility
        queryBuilder.andWhere('order.orderNumber ILIKE :search', { search: `%${searchTerm}%` });
      } else {
        // Mixed characters - use substring search
        queryBuilder.andWhere('order.orderNumber ILIKE :search', { search: `%${searchTerm}%` });
      }
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

  async updateOrderStatus(id: string, updateOrderDto: UpdateOrderDto, performedBy?: { id: string; name: string }): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['address', 'items', 'user']
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const newStatus = updateOrderDto.status;
    const previousStatus = order.status;
    Object.assign(order, updateOrderDto);
    await this.orderRepository.save(order);

    // Fire-and-forget status notification email
    if (newStatus && newStatus !== 'pending') {
      const orderId = id;
      const status = newStatus;
      setImmediate(async () => {
        try {
          const updatedOrder = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['user'],
          });
          if (updatedOrder?.user?.email) {
            const html = orderStatusTemplate({
              orderNumber: updatedOrder.orderNumber,
              customerName: updatedOrder.user.name,
              status,
              totalAmount: updatedOrder.totalAmount,
            });
            await this.emailService.send(updatedOrder.user.email, `Order ${updatedOrder.orderNumber} — ${status}`, html);
          }
        } catch (err) {
          this.logger.error(`Status email failed: ${err.message}`);
        }
      });
    }

    if (performedBy && this.activityService) {
      setImmediate(() => {
        this.activityService!.log({
          staffId: performedBy.id,
          staffName: performedBy.name,
          action: 'order_status_updated',
          entityType: 'order',
          entityId: id,
          entityLabel: order.orderNumber,
          details: { from: previousStatus, to: newStatus },
        }).catch(() => {});
      });
    }

    return order;
  }

  async createGuestOrder(createGuestOrderDto: CreateGuestOrderDto): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.debug('Creating guest order');
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

      
      const savedAddress = await queryRunner.manager.save(Address, guestAddress);
      

      // Calculate totals
      let subtotal = 0;
      const orderItems: OrderItem[] = [];

      for (const itemDto of createGuestOrderDto.items) {
        const product = products.find(p => p.id === itemDto.productId);
        if (!product) continue;

        // Always use server-side price — never trust client-provided price
        let resolvedUnitPrice = product.price;
        let resolvedVariantPrice: number | undefined;
        let resolvedVariantOriginalPrice: number | undefined;
        let itemName = product.name;

        if (itemDto.selectedVariant && product.hasVariants && product.variants) {
          const selectedVariant = product.variants.find(v => v.name === itemDto.selectedVariant);
          if (selectedVariant) {
            resolvedUnitPrice = selectedVariant.price;
            resolvedVariantPrice = selectedVariant.price;
            resolvedVariantOriginalPrice = selectedVariant.originalPrice;
            itemName = `${product.name} - ${selectedVariant.name}`;
          }
        }

        const totalPrice = resolvedUnitPrice * itemDto.quantity;
        subtotal += totalPrice;

        const orderItem = queryRunner.manager.create(OrderItem, {
          productId: product.id,
          itemName,
          itemImage: product.images?.[0] || '',
          unitPrice: resolvedUnitPrice,
          quantity: itemDto.quantity,
          totalPrice,
          unit: product.unit,
          specifications: product.specifications,
          selectedVariant: itemDto.selectedVariant,
          variantPrice: resolvedVariantPrice,
          variantOriginalPrice: resolvedVariantOriginalPrice,
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

      return orderWithRelations!;
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
        const foundAddress = await queryRunner.manager.findOne(Address, {
          where: { id: orderData.addressId, userId },
          relations: ['user']
        });

        if (!foundAddress) {
          throw new NotFoundException('Address not found or does not belong to user');
        }
        address = foundAddress;
        finalUserId = userId!;
      } else {
        // Guest user: create new address with null userId
        finalUserId = null as unknown as string;

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

      // Check inventory for each item (within transaction)
      for (const item of orderData.items) {
        const product = products.find(p => p.id === item.productId);
        if (!product) continue;

        // Load inventory if it exists
        const inventory = await queryRunner.manager.findOne(Inventory, {
          where: { productId: item.productId }
        });

        if (inventory) {
          const available = inventory.quantity - inventory.reservedQuantity;
          if (available < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for "${product.name}". Available: ${available}, Requested: ${item.quantity}`
            );
          }
          // Reserve the stock
          await queryRunner.manager.update(Inventory, inventory.id, {
            reservedQuantity: () => `"reservedQuantity" + ${item.quantity}`
          });
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

        // Always use server-side price — never trust client-provided price
        const unitPrice = product.price;
        let resolvedUnitPrice = unitPrice;
        let resolvedVariantPrice: number | undefined;
        let resolvedVariantOriginalPrice: number | undefined;
        let itemName = product.name;

        if (itemDto.selectedVariant && product.hasVariants && product.variants) {
          const selectedVariant = product.variants.find(v => v.name === itemDto.selectedVariant);
          if (selectedVariant) {
            // Use server-side variant price; ignore client-provided variantPrice
            resolvedUnitPrice = selectedVariant.price;
            resolvedVariantPrice = selectedVariant.price;
            resolvedVariantOriginalPrice = selectedVariant.originalPrice;
            itemName = `${product.name} - ${selectedVariant.name}`;
          }
        }

        const totalPrice = resolvedUnitPrice * itemDto.quantity;
        subtotal += totalPrice;

        const orderItem = queryRunner.manager.create(OrderItem, {
          productId: product.id,
          itemName,
          itemImage: product.images?.[0] || '',
          unitPrice: resolvedUnitPrice,
          quantity: itemDto.quantity,
          totalPrice,
          unit: product.unit,
          specifications: product.specifications,
          selectedVariant: itemDto.selectedVariant,
          variantPrice: resolvedVariantPrice,
          variantOriginalPrice: resolvedVariantOriginalPrice,
        });

        orderItems.push(orderItem);
      }

      // Validate minimum order amount
      const minOrderAmount = await this.settingsService.getSetting('min_order_amount', 500);
      if (subtotal < Number(minOrderAmount)) {
        throw new BadRequestException(`Minimum order amount is ₨${minOrderAmount}. Your order total is ₨${subtotal}`);
      }

      // Validate COD availability
      if (orderData.paymentMethod === 'cash_on_delivery') {
        const codEnabled = await this.settingsService.getSetting('cod_enabled', true);
        if (codEnabled === false) {
          throw new BadRequestException('Cash on delivery is currently not available. Please use bank transfer.');
        }
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

      // Capture all notification data BEFORE setImmediate (avoid closure stale reference issues)
      const adminEmail = await this.settingsService.getSetting('admin_email', env.ADMIN_EMAIL);
      const notificationData = {
        orderNumber: savedOrder.orderNumber,
        customerName: userId ? savedOrder.user?.name : orderData.address?.fullName || 'Customer',
        customerEmail: userId ? savedOrder.user?.email : (orderData.address as any)?.email,
        customerPhone: address?.phone || 'N/A',
        totalAmount: savedOrder.totalAmount,
        paymentMethod: savedOrder.paymentMethod,
        city: address?.city || 'Unknown',
        itemCount: orderItems.length,
        subtotal: savedOrder.subtotal,
        deliveryFee: savedOrder.deliveryFee,
        addressLine: [address?.addressLine1, address?.city, address?.state].filter(Boolean).join(', '),
        items: orderItems.map(i => ({
          itemName: i.itemName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          unit: i.unit || 'unit',
        })),
      };

      // Fire-and-forget notifications — don't block the order response
      setImmediate(() => {
        if (notificationData.customerEmail) {
          const html = orderConfirmationTemplate({
            orderNumber: notificationData.orderNumber,
            customerName: notificationData.customerName,
            items: notificationData.items,
            subtotal: notificationData.subtotal,
            deliveryFee: notificationData.deliveryFee,
            totalAmount: notificationData.totalAmount,
            paymentMethod: notificationData.paymentMethod,
            address: notificationData.addressLine,
          });
          this.emailService.send(
            notificationData.customerEmail,
            `Order Confirmed — ${notificationData.orderNumber}`,
            html,
          ).catch(err => this.logger.error(`Confirmation email failed: ${err.message}`));
        }

        this.emailService.send(
          adminEmail,
          `New Order — ${notificationData.orderNumber}`,
          adminNewOrderTemplate({
            orderNumber: notificationData.orderNumber,
            customerName: notificationData.customerName,
            customerPhone: notificationData.customerPhone,
            totalAmount: notificationData.totalAmount,
            paymentMethod: notificationData.paymentMethod,
            city: notificationData.city,
            itemCount: notificationData.itemCount,
          }),
        ).catch(err => this.logger.error(`Admin notification failed: ${err.message}`));
      });

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
