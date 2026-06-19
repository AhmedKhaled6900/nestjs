import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { AuthUser } from '../../auth/interfaces/auth.interface';
import {
  DashboardAnalyticsQueryDto,
  DashboardSummaryQueryDto,
} from '../dto/dashboard.dto';
import { ProviderDashboardService } from '../services/provider-dashboard.service';

@ApiTags('Provider Dashboard')
@ApiBearerAuth('access-token')
@Controller('provider/dashboard')
export class ProviderDashboardController {
  constructor(private readonly dashboardService: ProviderDashboardService) {}

  @Get('summary')
  @RequirePermissions('provider.dashboard.read')
  @ApiOperation({ summary: 'Dashboard summary: orders, leads, revenue, platformFee' })
  summary(
    @CurrentUser() user: AuthUser,
    @Query() query: DashboardSummaryQueryDto,
  ) {
    return this.dashboardService.getSummary(user.id, query);
  }

  @Get('analytics')
  @RequirePermissions('provider.dashboard.read')
  @ApiOperation({ summary: 'Revenue analytics (daily/weekly)' })
  analytics(
    @CurrentUser() user: AuthUser,
    @Query() query: DashboardAnalyticsQueryDto,
  ) {
    return this.dashboardService.getAnalytics(user.id, query);
  }
}
