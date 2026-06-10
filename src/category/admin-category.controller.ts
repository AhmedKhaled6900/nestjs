import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermissions, RequireRoles } from '../auth/decorators/permissions.decorator';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { QueryAdminCategoryDto } from './dto/query-admin-category.dto';
import { CategoryService } from './category.service';

@ApiTags('Admin - Categories')
@ApiBearerAuth('access-token')
@Controller('admin/categories')
export class AdminCategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get('select-menu')
  @RequireRoles('ADMIN')
  @RequirePermissions('category.read')
  @ApiOperation({
    summary: 'Category + subcategory tree for admin select menus (includes inactive)',
  })
  selectMenu() {
    return this.categoryService.findSelectMenu({ activeOnly: false });
  }

  @Get()
  @RequireRoles('ADMIN')
  @RequirePermissions('category.read')
  @ApiOperation({
    summary: 'List categories (paginated, includes inactive)',
    description:
      'Default: main categories with subcategories. Use parentId to list subcategories only.',
  })
  findAll(@Query() query: QueryAdminCategoryDto) {
    return this.categoryService.adminFindAll(query);
  }

  @Get(':id')
  @RequireRoles('ADMIN')
  @RequirePermissions('category.read')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({ name: 'id', example: 'uuid-here' })
  findOne(@Param('id') id: string) {
    return this.categoryService.adminFindById(id);
  }

  @Post()
  @RequireRoles('ADMIN')
  @RequirePermissions('category.create')
  @ApiOperation({
    summary: 'Create main category or subcategory',
    description: 'Omit parentId for main category. Set parentId to a main category UUID for subcategory.',
  })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.adminCreate(dto);
  }

  @Patch(':id')
  @RequireRoles('ADMIN')
  @RequirePermissions('category.update')
  @ApiOperation({ summary: 'Update category or subcategory' })
  @ApiParam({ name: 'id', example: 'uuid-here' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoryService.adminUpdate(id, dto);
  }

  @Delete(':id')
  @RequireRoles('ADMIN')
  @RequirePermissions('category.delete')
  @ApiOperation({
    summary: 'Delete category or subcategory',
    description:
      'Cannot delete if linked to properties or if main category still has subcategories.',
  })
  @ApiParam({ name: 'id', example: 'uuid-here' })
  remove(@Param('id') id: string) {
    return this.categoryService.adminRemove(id);
  }
}
