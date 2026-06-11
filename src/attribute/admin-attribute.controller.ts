import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions, RequireRoles } from '../auth/decorators/permissions.decorator';
import { AuthUser } from '../auth/interfaces/auth.interface';
import { AttributeService } from './attribute.service';
import {
  CreateAttributeDto,
  QueryAttributeDto,
  QueryAttributeSelectMenuDto,
  SyncSubcategoryAttributesDto,
  UpdateAttributeDto,
} from './dto/attribute.dto';

@ApiTags('Admin - Attributes')
@ApiBearerAuth('access-token')
@Controller('admin/attributes')
export class AdminAttributeController {
  constructor(private readonly attributeService: AttributeService) {}

  @Put('subcategories/:subcategoryId/links')
  @RequireRoles('ADMIN')
  @RequirePermissions('attribute.update')
  @ApiOperation({
    summary: 'Link SYSTEM attributes to a subcategory (replaces existing links)',
  })
  @ApiParam({ name: 'subcategoryId', description: 'Subcategory UUID' })
  syncSubcategoryAttributes(
    @Param('subcategoryId') subcategoryId: string,
    @Body() dto: SyncSubcategoryAttributesDto,
  ) {
    return this.attributeService.syncSubcategoryAttributes(subcategoryId, dto);
  }

  @Get('subcategories/:subcategoryId/links')
  @RequireRoles('ADMIN')
  @RequirePermissions('attribute.read')
  @ApiOperation({
    summary: 'List attributes linked to a subcategory (admin, includes inactive)',
  })
  @ApiParam({ name: 'subcategoryId', description: 'Subcategory UUID' })
  findSubcategoryLinks(@Param('subcategoryId') subcategoryId: string) {
    return this.attributeService.findAttributesForSubcategory(subcategoryId, {
      activeOnly: false,
    });
  }

  @Get('select-menu')
  @RequireRoles('ADMIN')
  @RequirePermissions('attribute.read')
  @ApiOperation({
    summary: 'All attributes for admin select menus (one request, no pagination)',
    description:
      'Use when linking SYSTEM attributes to a subcategory. Defaults to SYSTEM scope.',
  })
  selectMenu(@Query() query: QueryAttributeSelectMenuDto) {
    return this.attributeService.findSelectMenu({
      scope: query.scope,
      activeOnly: false,
      isActive: query.isActive,
    });
  }

  @Get()
  @RequireRoles('ADMIN')
  @RequirePermissions('attribute.read')
  @ApiOperation({ summary: 'List attribute definitions (paginated)' })
  findAll(@Query() query: QueryAttributeDto) {
    return this.attributeService.adminFindAll(query);
  }

  @Get(':id')
  @RequireRoles('ADMIN')
  @RequirePermissions('attribute.read')
  @ApiOperation({ summary: 'Get attribute by ID' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.attributeService.adminFindById(id);
  }

  @Post()
  @RequireRoles('ADMIN')
  @RequirePermissions('attribute.create')
  @ApiOperation({ summary: 'Create SYSTEM or COMPANY attribute definition' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAttributeDto) {
    return this.attributeService.adminCreate(dto, user.id);
  }

  @Patch(':id')
  @RequireRoles('ADMIN')
  @RequirePermissions('attribute.update')
  @ApiOperation({ summary: 'Update attribute definition' })
  update(@Param('id') id: string, @Body() dto: UpdateAttributeDto) {
    return this.attributeService.adminUpdate(id, dto);
  }

  @Delete(':id')
  @RequireRoles('ADMIN')
  @RequirePermissions('attribute.delete')
  @ApiOperation({ summary: 'Delete attribute (if not used on properties)' })
  remove(@Param('id') id: string) {
    return this.attributeService.adminRemove(id);
  }
}
