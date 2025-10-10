import { Controller, Get } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * GET /categories
   * Output minimalis: hanya id dan name
   */
  @Get()
  async findAll() {
    const categories = await this.categoriesService.findAll();

    return {
      status: 'success',
      message: 'Categories retrieved successfully',
      data: categories.map((c) => ({
        id: c.id,
        name: c.name,
      })),
    };
  }
}
