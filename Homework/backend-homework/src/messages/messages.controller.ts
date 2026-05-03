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

  @Post(':targetId')
  sendMessage(
    @Request() req: any,
    @Param('targetId') targetId: string,
    @Query('type') type: 'user' | 'project',
    @Body() body: { text: string; attachment?: any },
  ) {
    return this.messagesService.sendMessage(
      req.user.userId,
      body.text,
      {
        receiverId: type === 'user' ? targetId : undefined,
        projectId: type === 'project' ? targetId : undefined,
        attachment: body.attachment,
      }
    );
  }

  @Get('project/:projectId')
  getProjectMessages(
    @Request() req: any,
    @Param('projectId') projectId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messagesService.getProjectMessages(
      req.user.userId,
      projectId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
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
