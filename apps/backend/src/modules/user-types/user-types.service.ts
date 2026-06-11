import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserType } from './entities/user-type.entity';
import { CreateUserTypeDto } from './dto/create-user-type.dto';

@Injectable()
export class UserTypesService {
  constructor(
    @InjectRepository(UserType)
    private repo: Repository<UserType>,
  ) {}

  findAll(): Promise<UserType[]> {
    return this.repo.find({ order: { sortOrder: 'ASC', createdAt: 'ASC' } });
  }

  async findOne(id: string): Promise<UserType> {
    const ut = await this.repo.findOne({ where: { id } });
    if (!ut) throw new NotFoundException('User type not found');
    return ut;
  }

  create(dto: CreateUserTypeDto): Promise<UserType> {
    const ut = this.repo.create(dto);
    return this.repo.save(ut);
  }

  async update(id: string, dto: Partial<CreateUserTypeDto>): Promise<UserType> {
    const ut = await this.findOne(id);
    Object.assign(ut, dto);
    return this.repo.save(ut);
  }

  async remove(id: string): Promise<void> {
    const ut = await this.findOne(id);
    await this.repo.remove(ut);
  }
}
