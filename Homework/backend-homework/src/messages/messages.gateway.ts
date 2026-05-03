import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Mapa de userId -> socketId para saber quién está conectado
  private connectedUsers = new Map<string, string>();

  constructor(
    private messagesService: MessagesService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      // Guardar la relación userId <-> socketId
      client.data.userId = userId;
      this.connectedUsers.set(userId, client.id);

      // Unir al usuario a su sala personal
      client.join(`user:${userId}`);
      console.log(`User ${userId} connected via WebSocket`);
    } catch (error) {
      console.error('WebSocket auth error:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.connectedUsers.delete(userId);
      console.log(`User ${userId} disconnected`);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string; text: string; attachment?: any },
  ) {
    const senderId = client.data.userId;
    if (!senderId) return { error: 'No autenticado' };

    try {
      const message = await this.messagesService.sendMessage(senderId, data.text, {
        receiverId: data.receiverId,
        attachment: data.attachment,
      });

      this.server.to(`user:${data.receiverId}`).emit('newMessage', message);
      return { success: true, message };
    } catch (error) {
      return { error: error.message };
    }
  }

  @SubscribeMessage('joinProject')
  handleJoinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    client.join(`project:${data.projectId}`);
  }

  @SubscribeMessage('sendProjectMessage')
  async handleSendProjectMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string; text: string; attachment?: any },
  ) {
    const senderId = client.data.userId;
    if (!senderId) return { error: 'No autenticado' };

    try {
      const message = await this.messagesService.sendMessage(senderId, data.text, {
        projectId: data.projectId,
        attachment: data.attachment,
      });

      this.server.to(`project:${data.projectId}`).emit('newProjectMessage', message);
      return { success: true, message };
    } catch (error) {
      return { error: error.message };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId?: string; projectId?: string },
  ) {
    const senderId = client.data.userId;
    if (data.receiverId) {
      this.server.to(`user:${data.receiverId}`).emit('userTyping', { userId: senderId });
    } else if (data.projectId) {
      this.server.to(`project:${data.projectId}`).emit('userTyping', { userId: senderId, projectId: data.projectId });
    }
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId?: string; projectId?: string },
  ) {
    const senderId = client.data.userId;
    if (data.receiverId) {
      this.server.to(`user:${data.receiverId}`).emit('userStopTyping', { userId: senderId });
    } else if (data.projectId) {
      this.server.to(`project:${data.projectId}`).emit('userStopTyping', { userId: senderId, projectId: data.projectId });
    }
  }
}
