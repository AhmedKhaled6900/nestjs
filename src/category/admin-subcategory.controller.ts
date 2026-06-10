import {
  Body,
  Controller,
  Delete,
  Get,
  Head,
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
import { CategoryService } from './category.service';
import { CreateSubcategoryDto, UpdateSubcategoryDto } from './dto/subcategory.dto';
import { CreateSubcategoryLegacyDto } from './dto/create-subcategory-legacy.dto';
import { QueryAdminCategoryDto } from './dto/query-admin-category.dto';

@ApiTags('Admin - Subcategories')
@ApiBearerAuth('access-token')
@Controller('admin/subcategories')
export class AdminSubcategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get('select-menu')
  @Head('select-menu')
  @RequireRoles('ADMIN')
  @RequirePermissions('category.read')
  @ApiOperation({
    summary: 'All subcategories for admin select menus (one request, includes inactive)',
    description:
      'Optional parentId query filters by main category UUID.',
  })
  selectMenu(@Query() query: QueryAdminCategoryDto) {
    return this.categoryService.findSubcategorySelectMenu({
      parentId: query.parentId,
      activeOnly: false,
      isActive: query.isActive,
    });
  }

  @Get()
  @Head()
  @RequireRoles('ADMIN')
  @RequirePermissions('category.read')
  @ApiOperation({
    summary: 'List all subcategories (paginated, includes inactive)',
    description:
      'Optional parentId query filters by main category. Supports GET and HEAD.',
  })
  listAll(@Query() query: QueryAdminCategoryDto) {
    return this.categoryService.adminFindSubcategories(query);
  }

  @Post()
  @RequireRoles('ADMIN')
  @RequirePermissions('category.create')
  @ApiOperation({
    summary: 'Create subcategory (parentId required in body)',
  })
  create(@Body() dto: CreateSubcategoryDto) {
    return this.categoryService.adminCreateSubcategory(dto.parentId, dto);
  }

  @Get(':id')
  @Head(':id')
  @RequireRoles('ADMIN')
  @RequirePermissions('category.read')
  @ApiOperation({ summary: 'Get subcategory by ID' })
  @ApiParam({ name: 'id', example: 'uuid-here' })
  findOne(@Param('id') id: string) {
    return this.categoryService.adminFindSubcategoryById(id);
  }

  @Patch(':id')
  @RequireRoles('ADMIN')
  @RequirePermissions('category.update')
  @ApiOperation({ summary: 'Update subcategory' })
  @ApiParam({ name: 'id', example: 'uuid-here' })
  update(@Param('id') id: string, @Body() dto: UpdateSubcategoryDto) {
    return this.categoryService.adminUpdateSubcategory(id, dto);
  }

  @Delete(':id')
  @RequireRoles('ADMIN')
  @RequirePermissions('category.delete')
  @ApiOperation({
    summary: 'Delete subcategory',
    description: 'Cannot delete if linked to properties. Use isActive: false instead.',
  })
  @ApiParam({ name: 'id', example: 'uuid-here' })
  remove(@Param('id') id: string) {
    return this.categoryService.adminRemoveSubcategory(id);
  }
}

/** @deprecated Prefer GET/POST /admin/subcategories — kept for backward compatibility */
@ApiTags('Admin - Subcategories')
@ApiBearerAuth('access-token')
@Controller('admin/categories')
export class AdminSubcategoryLegacyController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get(':parentId/subcategories/select-menu')
  @Head(':parentId/subcategories/select-menu')
  @RequireRoles('ADMIN')
  @RequirePermissions('category.read')
  @ApiOperation({
    summary: 'All subcategories of a main category for select menus (legacy path)',
    description: 'Returns every subcategory under parentId in one request (no pagination).',
  })
  @ApiParam({ name: 'parentId', description: 'Main category UUID' })
  selectMenuByParent(@Param('parentId') parentId: string) {
    return this.categoryService.findSubcategorySelectMenu({
      parentId,
      activeOnly: false,
    });
  }

  @Get(':parentId/subcategories')
  @Head(':parentId/subcategories')
  @RequireRoles('ADMIN')
  @RequirePermissions('category.read')
  @ApiOperation({ summary: 'List subcategories of a main category (legacy path)' })
  @ApiParam({ name: 'parentId', description: 'Main category UUID' })
  listByParent(
    @Param('parentId') parentId: string,
    @Query() query: QueryAdminCategoryDto,
  ) {
    return this.categoryService.adminFindSubcategoriesByParent(parentId, query);
  }

  @Post(':parentId/subcategories')
  @RequireRoles('ADMIN')
  @RequirePermissions('category.create')
  @ApiOperation({ summary: 'Add subcategory under a main category (legacy path)' })
  @ApiParam({ name: 'parentId', description: 'Main category UUID' })
  create(
    @Param('parentId') parentId: string,
    @Body() dto: CreateSubcategoryLegacyDto,
  ) {
    return this.categoryService.adminCreateSubcategory(parentId, dto);
  }
}
