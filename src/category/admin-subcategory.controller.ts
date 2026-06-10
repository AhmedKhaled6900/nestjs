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
import { CategoryService } from './category.service';
import { CreateSubcategoryDto, UpdateSubcategoryDto } from './dto/subcategory.dto';
import { QueryAdminCategoryDto } from './dto/query-admin-category.dto';

@ApiTags('Admin - Subcategories')
@ApiBearerAuth('access-token')
@Controller('admin')
export class AdminSubcategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get('categories/:parentId/subcategories')
  @RequireRoles('ADMIN')
  @RequirePermissions('category.read')
  @ApiOperation({
    summary: 'List subcategories of a main category (paginated)',
  })
  @ApiParam({ name: 'parentId', description: 'Main category UUID' })
  listByParent(
    @Param('parentId') parentId: string,
    @Query() query: QueryAdminCategoryDto,
  ) {
    return this.categoryService.adminFindSubcategories(parentId, query);
  }

  @Post('categories/:parentId/subcategories')
  @RequireRoles('ADMIN')
  @RequirePermissions('category.create')
  @ApiOperation({ summary: 'Add subcategory under a main category' })
  @ApiParam({ name: 'parentId', description: 'Main category UUID' })
  create(
    @Param('parentId') parentId: string,
    @Body() dto: CreateSubcategoryDto,
  ) {
    return this.categoryService.adminCreateSubcategory(parentId, dto);
  }

  @Get('subcategories/:id')
  @RequireRoles('ADMIN')
  @RequirePermissions('category.read')
  @ApiOperation({ summary: 'Get subcategory by ID' })
  @ApiParam({ name: 'id', example: 'uuid-here' })
  findOne(@Param('id') id: string) {
    return this.categoryService.adminFindSubcategoryById(id);
  }

  @Patch('subcategories/:id')
  @RequireRoles('ADMIN')
  @RequirePermissions('category.update')
  @ApiOperation({ summary: 'Update subcategory' })
  @ApiParam({ name: 'id', example: 'uuid-here' })
  update(@Param('id') id: string, @Body() dto: UpdateSubcategoryDto) {
    return this.categoryService.adminUpdateSubcategory(id, dto);
  }

  @Delete('subcategories/:id')
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
