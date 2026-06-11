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
import { CartService } from './cart.service';

@ApiTags('Cart')
@ApiBearerAuth('access-token')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post(':propertyId')
  @RequirePermissions('cart.create')
  @ApiOperation({ summary: 'Add property to cart' })
  @ApiParam({ name: 'propertyId', example: 'uuid-here' })
  add(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
  ) {
    return this.cartService.add(user.id, propertyId);
  }

  @Get()
  @RequirePermissions('cart.read')
  @ApiOperation({ summary: 'List my cart (paginated)' })
  findMine(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.cartService.findMine(user.id, query);
  }

  @Delete()
  @RequirePermissions('cart.delete')
  @ApiOperation({ summary: 'Clear my cart' })
  clear(@CurrentUser() user: AuthUser) {
    return this.cartService.clear(user.id);
  }

  @Delete(':propertyId')
  @RequirePermissions('cart.delete')
  @ApiOperation({ summary: 'Remove one property from cart' })
  @ApiParam({ name: 'propertyId', example: 'uuid-here' })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
  ) {
    return this.cartService.remove(user.id, propertyId);
  }
}
