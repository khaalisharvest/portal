import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CloudinaryService } from './services/cloudinary.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new NotFoundException(`Category not found`);
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    // Delete old Cloudinary image if replaced
    if (updateCategoryDto.image !== undefined && category.image && updateCategoryDto.image !== category.image) {
      setImmediate(() => this.cloudinaryService.deleteImage(category.image));
    }

    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['productTypes', 'products'],
    });
    if (!category) throw new NotFoundException('Category not found');

    if (category.productTypes?.length > 0) {
      throw new BadRequestException(
        `Cannot delete: ${category.productTypes.length} product type(s) are using this category. Delete them first.`
      );
    }
    if (category.products?.length > 0) {
      throw new BadRequestException(
        `Cannot delete: ${category.products.length} product(s) are using this category. Delete them first.`
      );
    }

    const image = category.image;
    await this.categoryRepository.remove(category);

    // Delete Cloudinary image after successful DB deletion
    if (image) {
      setImmediate(() => this.cloudinaryService.deleteImage(image));
    }
  }
}
