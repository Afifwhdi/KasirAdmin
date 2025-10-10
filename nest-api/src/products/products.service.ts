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

  findAll() {
    return this.productRepo.find({ where: { deleted_at: IsNull() } });
  }

  findOne(id: number) {
    return this.productRepo.findOne({ where: { id, deleted_at: IsNull() } });
  }
}
