import { Logger, UseGuards } from '@nestjs/common';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { SocketWithUser } from '../auth/auth.types';
import { NotificationPayload, NotificationType } from './notifications.types';

@UseGuards(WsJwtGuard)
@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly wsJwtGuard: WsJwtGuard) {}

  // Гарды не выполняются на lifecycle-хуках, поэтому токен проверяем вручную
  handleConnection(client: SocketWithUser) {
    try {
      const payload = this.wsJwtGuard.verify(client);
      void client.join(payload.sub);
    } catch (error) {
      this.logger.warn(
        `Отклонено подключение ${client.id}: ${(error as Error).message}`,
      );
      client.disconnect(true);
    }
  }

  notifyUser(userId: string, payload: NotificationPayload) {
    this.server.to(userId).emit('notificateNewRequest', payload);
  }

  notifyNewRequest(ownerId: string, fromUser: string, skillName: string) {
    this.notifyUser(ownerId, {
      type: NotificationType.NEW_REQUEST,
      skillName,
      fromUser,
    });
  }

  notifyRequestAccepted(
    applicantId: string,
    fromUser: string,
    skillName: string,
  ) {
    this.notifyUser(applicantId, {
      type: NotificationType.REQUEST_ACCEPTED,
      skillName,
      fromUser,
    });
  }

  notifyRequestRejected(
    applicantId: string,
    fromUser: string,
    skillName: string,
  ) {
    this.notifyUser(applicantId, {
      type: NotificationType.REQUEST_REJECTED,
      skillName,
      fromUser,
    });
  }
}
