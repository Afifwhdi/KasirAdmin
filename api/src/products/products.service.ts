import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  /**
   * Ambil semua produk aktif + relasi kategori
   */
  findAll() {
    return this.productRepo.find({
      where: { deleted_at: IsNull() },
      relations: ['category'],
      order: { id: 'ASC' },
    });
  }

  /**
   * Ambil satu produk berdasarkan ID
   */
  findOne(id: number) {
    return this.productRepo.findOne({
      where: { id, deleted_at: IsNull() },
      relations: ['category'],
    });
  }
}
