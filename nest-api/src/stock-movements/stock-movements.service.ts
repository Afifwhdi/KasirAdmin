import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockMovement } from './entities/stock-movement.entity';

@Injectable()
export class StockMovementsService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly stockMovementRepo: Repository<StockMovement>,
  ) {}

  findByUuid(uuid: string) {
    return this.stockMovementRepo.findOne({ where: { uuid } });
  }

  async create(data: Omit<StockMovement, 'id' | 'created_at' | 'updated_at'>) {
    const entity = this.stockMovementRepo.create(data);
    return this.stockMovementRepo.save(entity);
  }
}
