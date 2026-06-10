import { Module } from '@nestjs/common';
import { AdminCategoryController } from './admin-category.controller';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';

@Module({
  controllers: [CategoryController, AdminCategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
