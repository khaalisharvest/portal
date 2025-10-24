import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Order, OrderStatus } from '../orders/entities/order.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: ['id', 'name', 'phone', 'email', 'role', 'isActive', 'lastLoginAt', 'createdAt'],
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'name', 'phone', 'email', 'role', 'isActive', 'profileImage', 'address', 'preferences', 'lastLoginAt', 'createdAt'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByPhone(phone: string): Promise<User> {
    return this.usersRepository.findOne({ where: { phone } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.usersRepository.remove(user);
  }

  async findByRole(role: string): Promise<User[]> {
    return this.usersRepository.find({
      where: { role },
      select: ['id', 'name', 'phone', 'email', 'role', 'isActive', 'lastLoginAt', 'createdAt'],
    });
  }

  // Admin methods
  async findAllWithPagination(page: number = 1, limit: number = 10, role?: string, search?: string) {
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.name', 'user.phone', 'user.email', 'user.role', 'user.isActive', 'user.lastLoginAt', 'user.createdAt'])
      .orderBy('user.createdAt', 'DESC');

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.name ILIKE :search OR user.phone ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [users, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      users,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    };
  }

  async findCustomersWithPagination(page: number = 1, limit: number = 10, search?: string) {
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.name', 'user.phone', 'user.email', 'user.role', 'user.isActive', 'user.lastLoginAt', 'user.createdAt'])
      .where('user.role = :role', { role: 'customer' })
      .orderBy('user.createdAt', 'DESC');

    if (search) {
      queryBuilder.andWhere(
        '(user.name ILIKE :search OR user.phone ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [users, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // Get order statistics for each customer
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        // Get order statistics
        const totalOrders = await this.orderRepository.count({
          where: { userId: user.id }
        });

        const completedOrders = await this.orderRepository.count({
          where: { userId: user.id, status: OrderStatus.DELIVERED }
        });

        const totalSpent = await this.orderRepository
          .createQueryBuilder('order')
          .select('SUM(order.totalAmount)', 'total')
          .where('order.userId = :userId', { userId: user.id })
          .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
          .getRawOne();

        const averageOrderValue = totalSpent.total && completedOrders > 0 
          ? parseFloat(totalSpent.total) / completedOrders 
          : 0;

        // Get recent orders (last 5 for the modal)
        const recentOrders = await this.orderRepository.find({
          where: { userId: user.id },
          order: { createdAt: 'DESC' },
          take: 5,
          select: ['id', 'orderNumber', 'status', 'totalAmount', 'createdAt']
        });

        return {
          ...user,
          orderStats: {
            totalOrders,
            completedOrders,
            totalSpent: totalSpent.total ? parseFloat(totalSpent.total) : 0,
            averageOrderValue,
            pendingOrders: totalOrders - completedOrders
          },
          recentOrders
        };
      })
    );

    return {
      users: usersWithStats,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    };
  }

  async findUserDetails(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: [
        'id', 'name', 'phone', 'email', 'role', 'isActive', 'profileImage', 
        'address', 'preferences', 'verification', 'lastLoginAt', 'loginAttempts', 
        'lockedUntil', 'createdAt', 'updatedAt'
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUserStatus(id: string, isActive: boolean): Promise<User> {
    const user = await this.findById(id);
    user.isActive = isActive;
    return this.usersRepository.save(user);
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const user = await this.findById(id);
    user.role = role;
    return this.usersRepository.save(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, { lastLoginAt: new Date() });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<User> {
    const user = await this.findById(id);
    user.password = hashedPassword;
    return this.usersRepository.save(user);
  }

  // Customer statistics methods
  async getCustomerStats(customerId: string) {
    const user = await this.findById(customerId);
    if (user.role !== 'customer') {
      throw new NotFoundException('User is not a customer');
    }

    // Get order statistics
    const totalOrders = await this.orderRepository.count({
      where: { userId: customerId }
    });

    const completedOrders = await this.orderRepository.count({
      where: { userId: customerId, status: OrderStatus.DELIVERED }
    });

    const totalSpent = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.userId = :customerId', { customerId })
      .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
      .getRawOne();

    const averageOrderValue = totalSpent.total && completedOrders > 0 
      ? parseFloat(totalSpent.total) / completedOrders 
      : 0;

    // Get recent orders
    const recentOrders = await this.orderRepository.find({
      where: { userId: customerId },
      order: { createdAt: 'DESC' },
      take: 5,
      select: ['id', 'orderNumber', 'status', 'totalAmount', 'createdAt']
    });

    return {
      customer: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        isActive: user.isActive,
        joinedAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      },
      stats: {
        totalOrders,
        completedOrders,
        totalSpent: totalSpent.total ? parseFloat(totalSpent.total) : 0,
        averageOrderValue,
        pendingOrders: totalOrders - completedOrders
      },
      recentOrders
    };
  }


  async getCustomerOrderHistory(customerId: string, page: number = 1, limit: number = 10) {
    const user = await this.findById(customerId);
    if (user.role !== 'customer') {
      throw new NotFoundException('User is not a customer');
    }

    const [orders, total] = await this.orderRepository.findAndCount({
      where: { userId: customerId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      select: ['id', 'orderNumber', 'status', 'totalAmount', 'createdAt', 'deliveredAt']
    });

    return {
      orders,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    };
  }
}
