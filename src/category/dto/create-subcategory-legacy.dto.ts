import { OmitType } from '@nestjs/swagger';
import { CreateSubcategoryDto } from './subcategory.dto';

/** Body for POST /admin/categories/:parentId/subcategories (parentId is in the URL) */
export class CreateSubcategoryLegacyDto extends OmitType(CreateSubcategoryDto, [
  'parentId',
] as const) {}
