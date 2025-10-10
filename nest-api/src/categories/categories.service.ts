import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) {}

  async findAll() {
    // Only return categories that are not soft deleted
    return this.categoryRepo.find({
      where: { deleted_at: IsNull() },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number) {
    return this.categoryRepo.findOne({
      where: { id, deleted_at: IsNull() },
    });
  }
}
