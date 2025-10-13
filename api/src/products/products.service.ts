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
   * Ambil semua produk aktif + relasi kategori dengan pagination
   */
  async findAll(query?: {
    page?: number;
    limit?: number;
    category_id?: number;
    search?: string;
  }) {
    const page = query?.page || 1;
    const limit = query?.limit || 50;
    const skip = (page - 1) * limit;

    const queryBuilder = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.is_active = :isActive', { isActive: true });

    // Filter by category
    if (query?.category_id) {
      queryBuilder.andWhere('product.category_id = :categoryId', {
        categoryId: query.category_id,
      });
    }

    // Search by name or barcode
    if (query?.search) {
      queryBuilder.andWhere(
        '(product.name LIKE :search OR product.barcode LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated data
    const products = await queryBuilder
      .orderBy('product.id', 'ASC')
      .skip(skip)
      .take(limit)
      .getMany();

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Ambil satu produk berdasarkan ID
   */
  findOne(id: number) {
    return this.productRepo.findOne({
      where: { id },
      relations: ['category'],
    });
  }
}
