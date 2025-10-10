import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@Body() _createCategoryDto: CreateCategoryDto) {
    void _createCategoryDto;
    return { message: 'Method not implemented: create' };
  }

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() _updateCategoryDto: UpdateCategoryDto,
  ) {
    void id;
    void _updateCategoryDto;
    return { message: 'Method not implemented: update' };
  }

  @Delete(':id')
  remove(@Param('id') _id: string) {
    void _id;
    return { message: 'Method not implemented: remove' };
  }
}
