import { Module } from '@nestjs/common';
import { AdminAttributeController } from './admin-attribute.controller';
import { AttributeController } from './attribute.controller';
import { AttributeService } from './attribute.service';
import { PropertyAttributeService } from './property-attribute.service';

@Module({
  controllers: [AdminAttributeController, AttributeController],
  providers: [AttributeService, PropertyAttributeService],
  exports: [AttributeService, PropertyAttributeService],
})
export class AttributeModule {}
