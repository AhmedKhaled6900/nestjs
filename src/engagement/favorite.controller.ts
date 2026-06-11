import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuthUser } from '../auth/interfaces/auth.interface';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { FavoriteService } from './favorite.service';

@ApiTags('Favorites')
@ApiBearerAuth('access-token')
@Controller('favorites')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post(':propertyId')
  @RequirePermissions('favorite.create')
  @ApiOperation({ summary: 'Add property to favorites' })
  @ApiParam({ name: 'propertyId', example: 'uuid-here' })
  add(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
  ) {
    return this.favoriteService.add(user.id, propertyId);
  }

  @Get()
  @RequirePermissions('favorite.read')
  @ApiOperation({ summary: 'List my favorite properties (paginated)' })
  findMine(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.favoriteService.findMine(user.id, query);
  }

  @Delete(':propertyId')
  @RequirePermissions('favorite.delete')
  @ApiOperation({ summary: 'Remove property from favorites' })
  @ApiParam({ name: 'propertyId', example: 'uuid-here' })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
  ) {
    return this.favoriteService.remove(user.id, propertyId);
  }
}
