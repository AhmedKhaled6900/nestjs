import { Module } from '@nestjs/common';
import { CategoryModule } from '../category/category.module';
import { UploadModule } from '../upload/upload.module';
import { AdminPropertyController } from './admin-property.controller';
import { BookingController } from './booking.controller';
import { PropertyImageService } from './property-image.service';
import { PropertyController } from './property.controller';
import { PropertyService } from './property.service';

@Module({
  imports: [CategoryModule, UploadModule],
  controllers: [
    PropertyController,
    AdminPropertyController,
    BookingController,
  ],
  providers: [PropertyService, PropertyImageService],
  exports: [PropertyService],
})
export class PropertyModule {}
