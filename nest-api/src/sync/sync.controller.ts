import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { SyncService } from './sync.service';
import type { FullSyncQueryDto } from './dto/full-sync.dto';
import type { UploadTransactionsDto } from './dto/upload-transactions.dto';
import type { UploadStockChangesDto } from './dto/upload-stock.dto';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('full')
  fullSync(@Query() query: FullSyncQueryDto) {
    return this.syncService.getFullSync(query);
  }

  @Post('upload')
  uploadTransactions(@Body() body: UploadTransactionsDto) {
    return this.syncService.uploadTransactions(body);
  }

  @Post('stock')
  uploadStock(@Body() body: UploadStockChangesDto) {
    return this.syncService.uploadStockChanges(body);
  }
}
