import { Module } from '@nestjs/common';
import { UploadModule } from '../upload/upload.module';
import { AdminServiceCategoryController } from './controllers/admin-service-category.controller';
import {
  AdminProviderController,
  ProviderProfileController,
} from './controllers/provider-profile.controller';
import { ProviderCoverageController } from './controllers/provider-coverage.controller';
import { ProviderDashboardController } from './controllers/provider-dashboard.controller';
import { ProviderListingController } from './controllers/provider-listing.controller';
import {
  ProviderMenuController,
  PublicProviderMenuController,
} from './controllers/provider-menu.controller';
import { ProviderPromotionController } from './controllers/provider-promotion.controller';
import {
  CustomerLeadController,
  CustomerMyLeadController,
  ProviderLeadController,
} from './controllers/service-lead.controller';
import {
  CustomerMyOrderController,
  CustomerOrderController,
  ProviderOrderController,
} from './controllers/service-order.controller';
import { ServicesPublicController } from './controllers/services-public.controller';
import { PaymobService } from './payment/paymob.service';
import { AdminProviderService } from './services/admin-provider.service';
import { AdminServiceCategoryService } from './services/admin-service-category.service';
import { ProviderCoverageService } from './services/provider-coverage.service';
import { ProviderDashboardService } from './services/provider-dashboard.service';
import { ProviderListingService } from './services/provider-listing.service';
import { ProviderMenuService } from './services/provider-menu.service';
import { ProviderProfileService } from './services/provider-profile.service';
import { ProviderPromotionService } from './services/provider-promotion.service';
import { ServiceDiscoveryService } from './services/service-discovery.service';
import { ServiceLeadService } from './services/service-lead.service';
import { ServiceOrderService } from './services/service-order.service';

@Module({
  imports: [UploadModule],
  controllers: [
    ProviderProfileController,
    AdminProviderController,
    ProviderCoverageController,
    ProviderListingController,
    ProviderMenuController,
    PublicProviderMenuController,
    CustomerOrderController,
    CustomerMyOrderController,
    ProviderOrderController,
    CustomerLeadController,
    CustomerMyLeadController,
    ProviderLeadController,
    ProviderDashboardController,
    ServicesPublicController,
    AdminServiceCategoryController,
    ProviderPromotionController,
  ],
  providers: [
    ProviderProfileService,
    ProviderCoverageService,
    ProviderListingService,
    ProviderMenuService,
    ServiceOrderService,
    ServiceLeadService,
    ProviderDashboardService,
    ServiceDiscoveryService,
    AdminServiceCategoryService,
    AdminProviderService,
    ProviderPromotionService,
    PaymobService,
  ],
  exports: [ProviderProfileService, ServiceOrderService, ServiceLeadService],
})
export class ServiceProviderModule {}
