import { Global, Module } from '@nestjs/common';
import { FirebaseModule } from '../firebase/firebase.module';
import { DeviceTokenService } from './device-token.service';
import { NotificationListener } from './listeners/notification.listener';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Global()
@Module({
  imports: [FirebaseModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationListener, DeviceTokenService],
  exports: [NotificationService, DeviceTokenService],
})
export class NotificationModule {}
