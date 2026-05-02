import { Controller, Get, Post, Param, Query, Body, UseGuards, Request, Delete } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get(':collaboratorId')
  getMessages(
    @Request() req: any,
    @Param('collaboratorId') collaboratorId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messagesService.getMessages(
      req.user.userId,
      collaboratorId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }

  @Post(':collaboratorId')
  sendMessage(
    @Request() req: any,
    @Param('collaboratorId') collaboratorId: string,
    @Body() body: { text: string; attachment?: any },
  ) {
    return this.messagesService.sendMessage(
      req.user.userId,
      collaboratorId,
      body.text,
      body.attachment,
    );
  }

  @Get(':collaboratorId/files')
  getSharedFiles(
    @Request() req: any,
    @Param('collaboratorId') collaboratorId: string,
    @Query('type') type?: 'image' | 'document',
  ) {
    return this.messagesService.getSharedFiles(req.user.userId, collaboratorId, type);
  }

  @Delete(':collaboratorId')
  clearChat(
    @Request() req: any,
    @Param('collaboratorId') collaboratorId: string,
  ) {
    return this.messagesService.clearChat(req.user.userId, collaboratorId);
  }
}
