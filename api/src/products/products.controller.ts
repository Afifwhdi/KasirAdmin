import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * GET /products
   * Output: minimalis — hanya field yang dibutuhkan FE (nama, harga, kategori)
   * Supports pagination, category filter, and search
   */
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category_id') categoryId?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.productsService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      category_id: categoryId ? parseInt(categoryId) : undefined,
      search,
    });

    return {
      status: 'success',
      message: 'Products retrieved successfully',
      data: result.data.map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        barcode: p.barcode,
        is_plu_enabled: Boolean(p.is_plu_enabled),
        category: p.category
          ? {
              id: p.category.id,
              name: p.category.name,
            }
          : null,
      })),
      meta: result.meta,
    };
  }

  /**
   * GET /products/:id
   * Output: detail lengkap untuk halaman view / edit
   */
  @Get(':id')
  async findOne(@Param('id') id: number) {
    const p = await this.productsService.findOne(id);

    if (!p) {
      return {
        status: 'error',
        message: `Product with id ${id} not found`,
      };
    }

    return {
      status: 'success',
      message: 'Product detail retrieved successfully',
      data: {
        id: p.id,
        name: p.name,
        category_id: p.category_id,
        category_name: p.category?.name || null,
        stock: Number(p.stock),
        cost_price: Number(p.cost_price),
        price: Number(p.price),
        image: p.image,
        sku: p.sku,
        barcode: p.barcode,
        is_plu_enabled: Boolean(p.is_plu_enabled),
        is_active: Boolean(p.is_active),
        created_at: p.created_at,
        updated_at: p.updated_at,
      },
    };
  }
}
