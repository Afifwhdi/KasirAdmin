import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('settings')
  async getSettings() {
    try {
      const [settings] = await this.dataSource.query(
        'SELECT name, address, phone, logo, print_via_bluetooth, name_printer_local FROM settings LIMIT 1',
      );

      if (!settings) {
        return {
          status: 'error',
          message: 'Settings not found',
        };
      }

      return {
        status: 'success',
        data: settings,
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to fetch settings',
      };
    }
  }
}
