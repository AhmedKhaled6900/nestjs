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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth.interface';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { DeviceTokenService } from './device-token.service';
import { RegisterDeviceTokenDto } from './dto/register-device.dto';
import { NotificationService } from './notification.service';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly deviceTokenService: DeviceTokenService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List my notifications (paginated, newest first)' })
  findMine(
    @CurrentUser() user: AuthUser,
    @Query() query: PaginationQueryDto,
  ) {
    return this.notificationService.findForUser(user.id, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  unreadCount(@CurrentUser() user: AuthUser) {
    return this.notificationService.getUnreadCount(user.id);
  }

  @Post('devices/register')
  @ApiOperation({
    summary: 'Register FCM device token for push notifications',
  })
  registerDevice(
    @CurrentUser() user: AuthUser,
    @Body() dto: RegisterDeviceTokenDto,
  ) {
    return this.deviceTokenService.register(
      user.id,
      dto.token,
      dto.platform,
    );
  }

  @Delete('devices/:token')
  @ApiOperation({ summary: 'Remove FCM device token (logout)' })
  @ApiParam({ name: 'token', description: 'FCM registration token' })
  removeDevice(@CurrentUser() user: AuthUser, @Param('token') token: string) {
    return this.deviceTokenService.remove(user.id, decodeURIComponent(token));
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all my notifications as read' })
  markAllAsRead(@CurrentUser() user: AuthUser) {
    return this.notificationService.markAllAsRead(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one notification as read' })
  @ApiParam({ name: 'id', example: 'uuid-here' })
  markAsRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notificationService.markAsRead(user.id, id);
  }
}
