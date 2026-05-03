import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  create(@Request() req: any, @Body() data: any) {
    return this.reviewsService.create(req.user, data);
  }

  @Get('technician/:id')
  findAllForTechnician(@Param('id') id: string) {
    return this.reviewsService.findAllForTechnician(id);
  }

  @Get('technician/:id/stats')
  getStats(@Param('id') id: string) {
    return this.reviewsService.getAverageRating(id);
  }
}
