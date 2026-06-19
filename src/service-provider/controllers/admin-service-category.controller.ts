import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import {
  CreateServiceCategoryDto,
  UpdateServiceCategoryDto,
} from '../dto/admin.dto';
import { AdminServiceCategoryService } from '../services/admin-service-category.service';

@ApiTags('Admin - Service Categories')
@ApiBearerAuth('access-token')
@Controller('admin/service-categories')
export class AdminServiceCategoryController {
  constructor(
    private readonly categoryService: AdminServiceCategoryService,
  ) {}

  @Get()
  @RequirePermissions('service.category.read')
  @ApiOperation({ summary: 'List service categories with commission rates' })
  list() {
    return this.categoryService.listCategories();
  }

  @Post()
  @RequirePermissions('service.category.manage')
  @ApiOperation({ summary: 'Create service category' })
  create(@Body() dto: CreateServiceCategoryDto) {
    return this.categoryService.createCategory(dto);
  }

  @Patch(':id')
  @RequirePermissions('service.category.manage')
  @ApiOperation({ summary: 'Update category or commission rate' })
  update(@Param('id') id: string, @Body() dto: UpdateServiceCategoryDto) {
    return this.categoryService.updateCategory(id, dto);
  }
}
