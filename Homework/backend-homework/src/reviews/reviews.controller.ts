import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReviewsService } from './reviews.service';

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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }
}
