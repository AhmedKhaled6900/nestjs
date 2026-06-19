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
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { AuthUser } from '../../auth/interfaces/auth.interface';
import {
  CreateCoverageAreaDto,
  UpdateCoverageAreaDto,
} from '../dto/coverage-area.dto';
import { ProviderCoverageService } from '../services/provider-coverage.service';

@ApiTags('Provider Coverage')
@ApiBearerAuth('access-token')
@Controller('provider/coverage-areas')
export class ProviderCoverageController {
  constructor(private readonly coverageService: ProviderCoverageService) {}

  @Get()
  @RequirePermissions('provider.coverage.manage')
  @ApiOperation({ summary: 'List my coverage areas' })
  list(@CurrentUser() user: AuthUser) {
    return this.coverageService.listMyCoverageAreas(user.id);
  }

  @Post()
  @RequirePermissions('provider.coverage.manage')
  @ApiOperation({ summary: 'Add coverage area' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCoverageAreaDto) {
    return this.coverageService.createCoverageArea(user.id, dto);
  }

  @Patch(':id')
  @RequirePermissions('provider.coverage.manage')
  @ApiOperation({ summary: 'Update coverage area' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCoverageAreaDto,
  ) {
    return this.coverageService.updateCoverageArea(user.id, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('provider.coverage.manage')
  @ApiOperation({ summary: 'Remove coverage area' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.coverageService.deleteCoverageArea(user.id, id);
  }
}
