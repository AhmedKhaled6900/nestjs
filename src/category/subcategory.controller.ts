import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/permissions.decorator';
import { CategoryService } from './category.service';
import { QuerySubcategoryDto } from './dto/query-subcategory.dto';

@ApiTags('Subcategories')
@Controller('subcategories')
export class SubcategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'List all subcategories (paginated)',
    description:
      'Public — client, owner, and admin can read. Returns active subcategories only. ' +
      'Optional parentId filters by main category.',
  })
  findAll(@Query() query: QuerySubcategoryDto) {
    return this.categoryService.findSubcategories(query, { activeOnly: true });
  }
}
