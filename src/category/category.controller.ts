import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Public } from '../auth/decorators/permissions.decorator';
import { CategoryService } from './category.service';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Public()
  @Get('select-menu')
  @ApiOperation({
    summary: 'Category + subcategory tree for select menus (all active, one request)',
    description:
      'Returns every main category with nested subcategories. Use when creating/editing a property.',
  })
  selectMenu() {
    return this.categoryService.findSelectMenu({ activeOnly: true });
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List main categories (paginated)' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.categoryService.findMainCategories(query);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get category by slug' })
  @ApiParam({ name: 'slug', example: 'apartment' })
  findBySlug(@Param('slug') slug: string) {
    return this.categoryService.findBySlug(slug);
  }
}
