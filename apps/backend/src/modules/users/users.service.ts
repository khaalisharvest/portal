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
    return this.usersRepository.findOne({ where: { phone } }) as Promise<User>;
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
    // Count query for pagination
    const countQb = this.usersRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: 'customer' });
    if (search) {
      countQb.andWhere(
        '(user.name ILIKE :search OR user.phone ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    const total = await countQb.getCount();

    // Single aggregate query — replaces 4 queries per user
    const aggQb = this.usersRepository
      .createQueryBuilder('user')
      .select('user.id', 'id')
      .addSelect('user.name', 'name')
      .addSelect('user.phone', 'phone')
      .addSelect('user.email', 'email')
      .addSelect('user.role', 'role')
      .addSelect('user.isActive', 'isActive')
      .addSelect('user.lastLoginAt', 'lastLoginAt')
      .addSelect('user.createdAt', 'createdAt')
      .addSelect('COUNT(DISTINCT o.id)', 'totalOrders')
      .addSelect(`COUNT(DISTINCT CASE WHEN o.status = '${OrderStatus.DELIVERED}' THEN o.id END)`, 'completedOrders')
      .addSelect(`COALESCE(SUM(CASE WHEN o.status = '${OrderStatus.DELIVERED}' THEN o."totalAmount" ELSE 0 END), 0)`, 'totalSpent')
      .leftJoin('orders', 'o', 'o."userId" = user.id')
      .where('user.role = :role', { role: 'customer' })
      .groupBy('user.id, user.name, user.phone, user.email, user.role, user.isActive, user.lastLoginAt, user.createdAt')
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      aggQb.andWhere(
        '(user.name ILIKE :search OR user.phone ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const rawRows = await aggQb.getRawMany();

    // Fetch last 5 orders per user in one query
    const userIds = rawRows.map(r => r.id);
    const recentOrdersMap = new Map<string, any[]>();
    if (userIds.length > 0) {
      const recent = await this.orderRepository
        .createQueryBuilder('order')
        .select(['order.id', 'order.orderNumber', 'order.status', 'order.totalAmount', 'order.createdAt', 'order.userId'])
        .where('order.userId IN (:...userIds)', { userIds })
        .orderBy('order.createdAt', 'DESC')
        .getMany();

      for (const o of recent) {
        if (!o.userId) continue;
        if (!recentOrdersMap.has(o.userId)) recentOrdersMap.set(o.userId, []);
        const list = recentOrdersMap.get(o.userId)!;
        if (list.length < 5) list.push(o);
      }
    }

    const users = rawRows.map(r => {
      const totalOrders = parseInt(r.totalOrders, 10) || 0;
      const completedOrders = parseInt(r.completedOrders, 10) || 0;
      const totalSpent = parseFloat(r.totalSpent) || 0;
      return {
        id: r.id,
        name: r.name,
        phone: r.phone,
        email: r.email,
        role: r.role,
        isActive: r.isActive,
        lastLoginAt: r.lastLoginAt,
        createdAt: r.createdAt,
        orderStats: {
          totalOrders,
          completedOrders,
          totalSpent,
          averageOrderValue: completedOrders > 0 ? totalSpent / completedOrders : 0,
          pendingOrders: totalOrders - completedOrders,
        },
        recentOrders: recentOrdersMap.get(r.id) || [],
      };
    });

    return {
      users,
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
    const validRoles = ['customer', 'staff', 'super_admin'];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }
    const user = await this.findById(id);
    user.role = role;
    return this.usersRepository.save(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, { lastLoginAt: new Date() });
  }

  async updateLoginAttempts(userId: string, attempts: number, lockedUntil: Date | null): Promise<void> {
    await this.usersRepository.update(userId, { loginAttempts: attempts, lockedUntil } as any);
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.usersRepository.update(id, { password: hashedPassword, resetToken: null, resetTokenExpiry: null } as any);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.resetToken')
      .where('user.resetToken = :token', { token })
      .getOne();
  }

  async setResetToken(userId: string, token: string | null, expiry: Date | null): Promise<void> {
    await this.usersRepository.update(userId, { resetToken: token, resetTokenExpiry: expiry } as any);
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
