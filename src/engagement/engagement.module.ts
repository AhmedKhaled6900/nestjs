import { Module } from '@nestjs/common';
import { PropertyModule } from '../property/property.module';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { EngagementHelperService } from './engagement-helper.service';
import { FavoriteController } from './favorite.controller';
import { FavoriteService } from './favorite.service';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

@Module({
  imports: [PropertyModule],
  controllers: [
    FavoriteController,
    CartController,
    ReviewController,
    CommentController,
  ],
  providers: [
    EngagementHelperService,
    FavoriteService,
    CartService,
    ReviewService,
    CommentService,
  ],
})
export class EngagementModule {}
