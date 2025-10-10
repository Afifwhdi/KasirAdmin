import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  /**
   * Ambil semua kategori aktif (yang belum dihapus)
   */
  findAll() {
    return this.categoryRepo.find({
      where: { deleted_at: IsNull() },
      order: { id: 'ASC' },
    });
  }
}
