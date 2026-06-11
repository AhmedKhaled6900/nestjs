import { Module } from '@nestjs/common';
import { PropertyModule } from '../property/property.module';
import { BookingController } from './booking.controller';
import { RentalService } from './rental.service';

@Module({
  imports: [PropertyModule],
  controllers: [BookingController],
  providers: [RentalService],
  exports: [RentalService],
})
export class RentalModule {}
