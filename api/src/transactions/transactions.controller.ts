import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.transactionsService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      status,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(+id);
  }

  @Post()
  async create(@Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(dto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'pending' | 'paid' | 'cancelled' | 'refunded' },
  ) {
    return this.transactionsService.updateStatus(+id, body.status);
  }

  @Patch(':id/pay')
  async payBon(
    @Param('id') id: string,
    @Body() body: { cash_received: number; change_amount: number },
  ) {
    return this.transactionsService.payBon(+id, body.cash_received, body.change_amount);
  }
}
