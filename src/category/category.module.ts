import { Module } from '@nestjs/common';
import { AdminCategoryController } from './admin-category.controller';
import { AdminSubcategoryController } from './admin-subcategory.controller';
import { CategoryController } from './category.controller';
import { SubcategoryController } from './subcategory.controller';
import { CategoryService } from './category.service';

@Module({
  controllers: [
    CategoryController,
    SubcategoryController,
    AdminCategoryController,
    AdminSubcategoryController,
  ],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
