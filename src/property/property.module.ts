import { Module } from '@nestjs/common';
import { BookingController, PropertyController } from './property.controller';

@Module({
  controllers: [PropertyController, BookingController],
})
export class PropertyModule {}
