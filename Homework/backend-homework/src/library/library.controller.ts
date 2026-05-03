import { Controller, Get, Post, Param, Query, UseGuards, Request, Patch } from '@nestjs/common';
import { LibraryService } from './library.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('library')
@UseGuards(JwtAuthGuard)
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get('books')
  findAll(@Request() req: any, @Query() query: { search?: string; category?: string }) {
    return this.libraryService.findAll(req.user.institutionId, query);
  }

  @Get('categories')
  getCategories() {
    return this.libraryService.getCategories();
  }

  @Get('books/:id')
  findOne(@Param('id') id: string) {
    return this.libraryService.findOne(id);
  }

  @Post('books/:id/loan')
  loanBook(@Request() req: any, @Param('id') id: string) {
    return this.libraryService.loanBook(id, req.user.userId);
  }

  @Patch('loans/:id/return')
  returnBook(@Param('id') id: string) {
    return this.libraryService.returnBook(id);
  }
}
