import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

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

    if (query?.category_id) {
      queryBuilder.andWhere('product.category_id = :categoryId', {
        categoryId: query.category_id,
      });
    }

    if (query?.search) {
      queryBuilder.andWhere(
        '(product.name LIKE :search OR product.barcode LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const total = await queryBuilder.getCount();

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

  findOne(id: number) {
    return this.productRepo.findOne({
      where: { id },
      relations: ['category'],
    });
  }
}
