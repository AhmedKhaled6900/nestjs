import { Module } from '@nestjs/common';
import { UploadModule } from '../upload/upload.module';
import {
  AdminOwnerController,
  OwnerProfileController,
} from './owner-profile.controller';
import { OwnerProfileService } from './owner-profile.service';

@Module({
  imports: [UploadModule],
  controllers: [OwnerProfileController, AdminOwnerController],
  providers: [OwnerProfileService],
  exports: [OwnerProfileService],
})
export class OwnerModule {}
