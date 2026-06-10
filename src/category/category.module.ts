import { Module } from '@nestjs/common';
import { AdminCategoryController } from './admin-category.controller';
import { AdminSubcategoryController } from './admin-subcategory.controller';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';

@Module({
  controllers: [CategoryController, AdminCategoryController, AdminSubcategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
