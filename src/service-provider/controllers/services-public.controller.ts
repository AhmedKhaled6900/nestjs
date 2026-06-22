import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/permissions.decorator';
import { QueryFeaturedListingsDto, QueryProvidersDto } from '../dto/discovery.dto';
import { ServiceDiscoveryService } from '../services/service-discovery.service';

@ApiTags('Services (Public)')
@Controller('services')
export class ServicesPublicController {
  constructor(private readonly discoveryService: ServiceDiscoveryService) {}

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'List active service categories' })
  listCategories() {
    return this.discoveryService.listCategories();
  }

  @Get('listings/featured')
  @Public()
  @ApiOperation({ summary: 'Featured listings for homepage banner' })
  listFeaturedListings(@Query() query: QueryFeaturedListingsDto) {
    return this.discoveryService.listFeaturedListings(query);
  }

  @Get('providers')
  @Public()
  @ApiOperation({ summary: 'Discover service providers by city/area/category' })
  listProviders(@Query() query: QueryProvidersDto) {
    return this.discoveryService.listProviders(query);
  }

  @Get('providers/:id')
  @Public()
  @ApiOperation({ summary: 'Provider details with active listings/menu' })
  getProvider(@Param('id') id: string) {
    return this.discoveryService.getProviderDetails(id);
  }
}
