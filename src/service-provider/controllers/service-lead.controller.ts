import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { AuthUser } from '../../auth/interfaces/auth.interface';
import {
  CreateServiceLeadDto,
  QueryProviderLeadsDto,
  UpdateServiceLeadStatusDto,
} from '../dto/lead.dto';
import { ServiceLeadService } from '../services/service-lead.service';

@ApiTags('Services - Leads (Customer)')
@ApiBearerAuth('access-token')
@Controller('services/leads')
export class CustomerLeadController {
  constructor(private readonly leadService: ServiceLeadService) {}

  @Post()
  @RequirePermissions('service.lead.create')
  @ApiOperation({ summary: 'Submit transport service lead' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateServiceLeadDto) {
    return this.leadService.createLead(user.id, dto);
  }
}

@ApiTags('Services - My Leads')
@ApiBearerAuth('access-token')
@Controller('services/my/leads')
export class CustomerMyLeadController {
  constructor(private readonly leadService: ServiceLeadService) {}

  @Get()
  @RequirePermissions('service.lead.read')
  @ApiOperation({ summary: 'List my transport leads' })
  listMy(@CurrentUser() user: AuthUser, @Query() query: QueryProviderLeadsDto) {
    return this.leadService.listMyLeads(user.id, query);
  }
}

@ApiTags('Provider Leads')
@ApiBearerAuth('access-token')
@Controller('provider/leads')
export class ProviderLeadController {
  constructor(private readonly leadService: ServiceLeadService) {}

  @Get()
  @RequirePermissions('provider.lead.read')
  @ApiOperation({ summary: 'List provider leads' })
  list(@CurrentUser() user: AuthUser, @Query() query: QueryProviderLeadsDto) {
    return this.leadService.listProviderLeads(user.id, query);
  }

  @Patch(':id/status')
  @RequirePermissions('provider.lead.manage')
  @ApiOperation({ summary: 'Update lead status' })
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateServiceLeadStatusDto,
  ) {
    return this.leadService.updateLeadStatus(user.id, id, dto);
  }
}
