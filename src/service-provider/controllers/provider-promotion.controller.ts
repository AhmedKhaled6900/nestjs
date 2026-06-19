import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { AuthUser } from '../../auth/interfaces/auth.interface';
import {
  ConfirmPromotionPaymentDto,
  CreateProviderPromotionDto,
} from '../dto/promotion.dto';
import { ProviderPromotionService } from '../services/provider-promotion.service';

@ApiTags('Provider Promotions')
@ApiBearerAuth('access-token')
@Controller('provider/promotions')
export class ProviderPromotionController {
  constructor(private readonly promotionService: ProviderPromotionService) {}

  @Get()
  @RequirePermissions('provider.promotion.manage')
  @ApiOperation({ summary: 'List my paid promotions' })
  list(@CurrentUser() user: AuthUser) {
    return this.promotionService.listMyPromotions(user.id);
  }

  @Post()
  @RequirePermissions('provider.promotion.manage')
  @ApiOperation({ summary: 'Create paid promotion (Paymob checkout when configured)' })
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateProviderPromotionDto,
  ) {
    return this.promotionService.createPromotion(user.id, dto);
  }

  @Post(':id/confirm-payment')
  @RequirePermissions('provider.promotion.manage')
  @ApiOperation({ summary: 'Confirm promotion payment and activate' })
  confirmPayment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ConfirmPromotionPaymentDto,
  ) {
    return this.promotionService.confirmPayment(user.id, id, dto.paymobOrderId);
  }
}
