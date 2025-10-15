import { Controller, Get, UseGuards, Request } from '@nestjs/common';
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

  /**
   * Bootstrap endpoint - Gabungkan data awal untuk POS
   * Mengurangi API calls dari 3-4 menjadi 1 call
   * GET /bootstrap
   */
  @Get('bootstrap')
  async getBootstrap() {
    try {
      // Parallel fetch untuk performance
      const [products, categories, settings] = await Promise.all([
        // Products - hanya yang aktif dan ada stok
        this.dataSource.query(`
          SELECT 
            p.id, 
            p.name, 
            p.price, 
            p.stock,
            p.barcode, 
            p.is_plu_enabled,
            c.id as category_id,
            c.name as category_name
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.is_active = true
          ORDER BY p.name ASC
          LIMIT 200
        `),

        // Categories - semua kategori aktif
        this.dataSource.query(`
          SELECT id, name
          FROM categories
          ORDER BY name ASC
        `),

        // Settings
        this.dataSource.query(`
          SELECT name, address, phone, logo, print_via_bluetooth, name_printer_local
          FROM settings
          LIMIT 1
        `),
      ]);

      // Format products
      const formattedProducts = products.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        stock: Number(p.stock),
        barcode: p.barcode,
        is_plu_enabled: Boolean(p.is_plu_enabled),
        category: p.category_id
          ? {
              id: p.category_id,
              name: p.category_name,
            }
          : null,
      }));

      return {
        status: 'success',
        message: 'Bootstrap data loaded successfully',
        data: {
          products: formattedProducts,
          categories: categories,
          settings: settings[0] || null,
        },
        meta: {
          products_count: formattedProducts.length,
          categories_count: categories.length,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Bootstrap error:', error);
      return {
        status: 'error',
        message: 'Failed to load bootstrap data',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
