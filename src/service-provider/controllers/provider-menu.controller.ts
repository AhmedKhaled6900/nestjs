import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public, RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { AuthUser } from '../../auth/interfaces/auth.interface';
import { CreateMenuItemDto, UpdateMenuItemDto } from '../dto/menu-item.dto';
import { ProviderMenuService } from '../services/provider-menu.service';

@ApiTags('Provider Menu')
@ApiBearerAuth('access-token')
@Controller('provider/menu-items')
export class ProviderMenuController {
  constructor(private readonly menuService: ProviderMenuService) {}

  @Get()
  @RequirePermissions('provider.menu.manage')
  @ApiOperation({ summary: 'List my profile menu (all items)' })
  listMine(@CurrentUser() user: AuthUser) {
    return this.menuService.listMyMenu(user.id);
  }

  @Post()
  @RequirePermissions('provider.menu.manage')
  @ApiOperation({ summary: 'Add item to profile menu' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMenuItemDto) {
    return this.menuService.createMenuItem(user.id, dto);
  }

  @Patch(':id')
  @RequirePermissions('provider.menu.manage')
  @ApiOperation({ summary: 'Update profile menu item' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.menuService.updateMenuItem(user.id, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('provider.menu.manage')
  @ApiOperation({ summary: 'Delete profile menu item' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.menuService.deleteMenuItem(user.id, id);
  }
}

@ApiTags('Services (Public)')
@Controller('services/providers')
export class PublicProviderMenuController {
  constructor(private readonly menuService: ProviderMenuService) {}

  @Get(':providerId/menu')
  @Public()
  @ApiOperation({ summary: 'Provider profile menu (active items only)' })
  listPublic(@Param('providerId') providerId: string) {
    return this.menuService.listPublicMenu(providerId);
  }
}
