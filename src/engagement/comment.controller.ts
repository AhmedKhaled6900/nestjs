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
import { CommentService } from './comment.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';

@ApiTags('Comments')
@Controller()
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Public()
  @Get('properties/:propertyId/comments')
  @ApiOperation({ summary: 'List comments for a property (public, paginated)' })
  @ApiParam({ name: 'propertyId', example: 'uuid-here' })
  findByProperty(
    @Param('propertyId') propertyId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.commentService.findByProperty(propertyId, query);
  }

  @Post('properties/:propertyId/comments')
  @ApiBearerAuth('access-token')
  @RequirePermissions('comment.create')
  @ApiOperation({ summary: 'Add a comment (customer only)' })
  @ApiParam({ name: 'propertyId', example: 'uuid-here' })
  create(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentService.create(user, propertyId, dto);
  }

  @Get('comments/me')
  @ApiBearerAuth('access-token')
  @RequirePermissions('comment.read')
  @ApiOperation({ summary: 'List my comments' })
  findMine(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.commentService.findMine(user.id, query);
  }

  @Patch('comments/:id')
  @ApiBearerAuth('access-token')
  @RequirePermissions('comment.update')
  @ApiOperation({
    summary: 'Update a comment (author or admin only)',
  })
  @ApiParam({ name: 'id', example: 'uuid-here' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentService.update(user, id, dto);
  }

  @Delete('comments/:id')
  @ApiBearerAuth('access-token')
  @RequirePermissions('comment.delete')
  @ApiOperation({
    summary: 'Delete a comment (author or admin only)',
  })
  @ApiParam({ name: 'id', example: 'uuid-here' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.commentService.remove(user, id);
  }
}
