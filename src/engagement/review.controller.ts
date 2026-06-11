import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public, RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuthUser } from '../auth/interfaces/auth.interface';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { ReviewService } from './review.service';

@ApiTags('Reviews')
@Controller()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Public()
  @Get('properties/:propertyId/reviews')
  @ApiOperation({ summary: 'List reviews for a property (public, paginated)' })
  @ApiParam({ name: 'propertyId', example: 'uuid-here' })
  findByProperty(
    @Param('propertyId') propertyId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.reviewService.findByProperty(propertyId, query);
  }

  @Post('properties/:propertyId/reviews')
  @ApiBearerAuth('access-token')
  @RequirePermissions('review.create')
  @ApiOperation({ summary: 'Create a review (customer only, one per property)' })
  @ApiParam({ name: 'propertyId', example: 'uuid-here' })
  create(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewService.create(user, propertyId, dto);
  }

  @Get('reviews/me')
  @ApiBearerAuth('access-token')
  @RequirePermissions('review.read')
  @ApiOperation({ summary: 'List my reviews' })
  findMine(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.reviewService.findMine(user.id, query);
  }

  @Patch('reviews/:id')
  @ApiBearerAuth('access-token')
  @RequirePermissions('review.update')
  @ApiOperation({
    summary: 'Update a review (author or admin only)',
  })
  @ApiParam({ name: 'id', example: 'uuid-here' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewService.update(user, id, dto);
  }

  @Delete('reviews/:id')
  @ApiBearerAuth('access-token')
  @RequirePermissions('review.delete')
  @ApiOperation({
    summary: 'Delete a review (author or admin only)',
  })
  @ApiParam({ name: 'id', example: 'uuid-here' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.reviewService.remove(user, id);
  }
}
