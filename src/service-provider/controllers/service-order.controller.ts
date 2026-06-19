import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { AuthUser } from '../../auth/interfaces/auth.interface';
import {
  CreateServiceOrderDto,
  QueryProviderOrdersDto,
  RejectOrderDto,
  UpdateServiceOrderStatusDto,
} from '../dto/order.dto';
import { ServiceOrderService } from '../services/service-order.service';

@ApiTags('Services - Orders (Customer)')
@ApiBearerAuth('access-token')
@Controller('services/orders')
export class CustomerOrderController {
  constructor(private readonly orderService: ServiceOrderService) {}

  @Post()
  @RequirePermissions('service.order.create')
  @ApiOperation({ summary: 'Place a food service order' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateServiceOrderDto) {
    return this.orderService.createOrder(user.id, dto);
  }
}

@ApiTags('Services - My Orders')
@ApiBearerAuth('access-token')
@Controller('services/my/orders')
export class CustomerMyOrderController {
  constructor(private readonly orderService: ServiceOrderService) {}

  @Get()
  @RequirePermissions('service.order.read')
  @ApiOperation({ summary: 'List my service orders' })
  listMy(@CurrentUser() user: AuthUser, @Query() query: QueryProviderOrdersDto) {
    return this.orderService.listMyOrders(user.id, query);
  }
}

@ApiTags('Provider Orders')
@ApiBearerAuth('access-token')
@Controller('provider/orders')
export class ProviderOrderController {
  constructor(private readonly orderService: ServiceOrderService) {}

  @Get()
  @RequirePermissions('provider.order.read')
  @ApiOperation({ summary: 'List provider orders' })
  list(@CurrentUser() user: AuthUser, @Query() query: QueryProviderOrdersDto) {
    return this.orderService.listProviderOrders(user.id, query);
  }

  @Patch(':id/accept')
  @RequirePermissions('provider.order.manage')
  @ApiOperation({ summary: 'Accept order' })
  accept(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.orderService.acceptOrder(user.id, id);
  }

  @Patch(':id/reject')
  @RequirePermissions('provider.order.manage')
  @ApiOperation({ summary: 'Reject order' })
  reject(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RejectOrderDto,
  ) {
    return this.orderService.rejectOrder(user.id, id, dto);
  }

  @Patch(':id/status')
  @RequirePermissions('provider.order.manage')
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateServiceOrderStatusDto,
  ) {
    return this.orderService.updateOrderStatus(user.id, id, dto);
  }
}
