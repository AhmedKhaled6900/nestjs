import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/permissions.decorator';
import { AttributeService } from './attribute.service';
import { QueryAttributeSelectMenuDto } from './dto/attribute.dto';

@ApiTags('Attributes')
@Controller()
export class AttributeController {
  constructor(private readonly attributeService: AttributeService) {}

  @Public()
  @Get('attributes/select-menu')
  @ApiOperation({
    summary: 'Active SYSTEM attributes for select menus (custom attribute type picker)',
  })
  selectMenu(@Query() query: QueryAttributeSelectMenuDto) {
    return this.attributeService.findSelectMenu({
      scope: query.scope,
      activeOnly: true,
      isActive: query.isActive,
    });
  }

  @Public()
  @Get('subcategories/:subcategoryId/attributes')
  @ApiOperation({
    summary: 'Attributes for property form (by subcategory)',
    description:
      'Returns active SYSTEM attributes linked to the subcategory. ' +
      'Use after the user selects parent category + subcategory.',
  })
  @ApiParam({ name: 'subcategoryId', description: 'Subcategory UUID' })
  findForSubcategory(@Param('subcategoryId') subcategoryId: string) {
    return this.attributeService.findAttributesForSubcategory(subcategoryId, {
      activeOnly: true,
    });
  }
}
