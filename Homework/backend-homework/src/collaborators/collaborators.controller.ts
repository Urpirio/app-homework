import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { CollaboratorsService } from './collaborators.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SendRequestDto } from './dto/send-request.dto';

@Controller('collaborators')
@UseGuards(JwtAuthGuard)
export class CollaboratorsController {
  constructor(private readonly collaboratorsService: CollaboratorsService) {}

  @Post('request')
  sendRequest(@Request() req: any, @Body() dto: SendRequestDto) {
    return this.collaboratorsService.sendRequest(req.user.userId, dto.identityCode);
  }

  @Get('search/:identityCode')
  searchByCode(@Param('identityCode') identityCode: string) {
    return this.collaboratorsService.findByIdentityCode(identityCode);
  }

  @Get()
  getCollaborators(@Request() req: any) {
    return this.collaboratorsService.getCollaborators(req.user.userId);
  }

  @Get('pending')
  getPendingRequests(@Request() req: any) {
    return this.collaboratorsService.getPendingRequests(req.user.userId);
  }

  @Patch(':id/accept')
  acceptRequest(@Request() req: any, @Param('id') id: string) {
    return this.collaboratorsService.acceptRequest(id, req.user.userId);
  }

  @Patch(':id/reject')
  rejectRequest(@Request() req: any, @Param('id') id: string) {
    return this.collaboratorsService.rejectRequest(id, req.user.userId);
  }

  @Get(':id/common-projects')
  getCommonProjects(@Request() req: any, @Param('id') collaboratorId: string) {
    return this.collaboratorsService.getCommonProjects(req.user.userId, collaboratorId);
  }
}
