import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermissions, RequireRoles } from '../auth/decorators/permissions.decorator';
import { AdminUsersService } from './admin-users.service';
import {
  QueryAdminCustomersDto,
  QueryAdminOwnersDto,
} from './dto/query-admin-users.dto';

@ApiTags('Admin - Users')
@ApiBearerAuth('access-token')
@Controller('admin')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get('customers')
  @RequireRoles('ADMIN')
  @RequirePermissions('users.read')
  @ApiOperation({
    summary: 'List all registered customers (paginated)',
    description:
      'Filter by emailVerification (VERIFIED | NOT_VERIFIED) and profileCompletion. ' +
      'For customers, profileCompletion equals email verification.',
  })
  listCustomers(@Query() query: QueryAdminCustomersDto) {
    return this.adminUsersService.listCustomers(query);
  }

  @Get('owners')
  @RequireRoles('ADMIN')
  @RequirePermissions('users.read')
  @ApiOperation({
    summary: 'List all registered owners (paginated)',
    description:
      'Filter by emailVerification, profileCompletion (COMPLETE | INCOMPLETE), ' +
      'or exact profileStatus enum (INCOMPLETE, KYC_PENDING, VERIFIED, REJECTED, BASIC_DONE).',
  })
  listOwners(@Query() query: QueryAdminOwnersDto) {
    return this.adminUsersService.listOwners(query);
  }
}
