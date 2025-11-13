import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './entities/contact.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
  ) {}

  async create(createContactDto: CreateContactDto): Promise<Contact> {
    const contact = this.contactRepository.create(createContactDto);
    return this.contactRepository.save(contact);
  }

  async findAll(filters: {
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ contacts: Contact[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.contactRepository.createQueryBuilder('contact');

    if (filters.status) {
      queryBuilder.where('contact.status = :status', { status: filters.status });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(contact.name ILIKE :search OR contact.email ILIKE :search OR contact.subject ILIKE :search OR contact.message ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    queryBuilder.orderBy('contact.createdAt', 'DESC');

    const [contacts, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return {
      contacts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Contact> {
    const contact = await this.contactRepository.findOne({ where: { id } });
    if (!contact) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }
    return contact;
  }

  async update(id: string, updateContactDto: UpdateContactDto, adminId?: string): Promise<Contact> {
    const contact = await this.findOne(id);

    if (updateContactDto.status) {
      contact.status = updateContactDto.status;
    }

    if (updateContactDto.adminResponse) {
      contact.adminResponse = updateContactDto.adminResponse;
      contact.respondedBy = adminId;
      contact.respondedAt = new Date();
      // Auto-update status to 'replied' if response is provided
      if (contact.status !== 'archived') {
        contact.status = 'replied';
      }
    }

    return this.contactRepository.save(contact);
  }

  async markAsRead(id: string): Promise<Contact> {
    const contact = await this.findOne(id);
    if (contact.status === 'pending') {
      contact.status = 'read';
      return this.contactRepository.save(contact);
    }
    return contact;
  }

  async delete(id: string): Promise<void> {
    const contact = await this.findOne(id);
    await this.contactRepository.remove(contact);
  }

  async getStats(): Promise<{
    total: number;
    pending: number;
    read: number;
    replied: number;
    archived: number;
  }> {
    const [total, pending, read, replied, archived] = await Promise.all([
      this.contactRepository.count(),
      this.contactRepository.count({ where: { status: 'pending' } }),
      this.contactRepository.count({ where: { status: 'read' } }),
      this.contactRepository.count({ where: { status: 'replied' } }),
      this.contactRepository.count({ where: { status: 'archived' } }),
    ]);

    return { total, pending, read, replied, archived };
  }
}

