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
      interface SettingsRow {
        name: string;
        address: string;
        phone: string;
        logo: string;
        print_via_bluetooth: number;
        name_printer_local: string;
      }

      const result = await this.dataSource.query<SettingsRow[]>(
        'SELECT name, address, phone, logo, print_via_bluetooth, name_printer_local FROM settings LIMIT 1',
      );
      const settings = result[0];

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
    } catch {
      return {
        status: 'error',
        message: 'Failed to fetch settings',
      };
    }
  }

  @Get('bootstrap')
  async getBootstrap() {
    try {
      interface ProductRow {
        id: number;
        name: string;
        price: number;
        stock: number;
        barcode: string | null;
        is_plu_enabled: number;
        category_id: number | null;
        category_name: string | null;
      }

      interface CategoryRow {
        id: number;
        name: string;
      }

      interface SettingsRow {
        name: string;
        address: string;
        phone: string;
        logo: string;
        print_via_bluetooth: number;
        name_printer_local: string;
      }

      const [products, categories, settings] = await Promise.all([
        this.dataSource.query<ProductRow[]>(`
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

        this.dataSource.query<CategoryRow[]>(`
          SELECT id, name
          FROM categories
          ORDER BY name ASC
        `),

        this.dataSource.query<SettingsRow[]>(`
          SELECT name, address, phone, logo, print_via_bluetooth, name_printer_local
          FROM settings
          LIMIT 1
        `),
      ]);

      const formattedProducts = products.map((p) => ({
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
