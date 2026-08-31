import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { jwtConfig } from '../../config/jwt.config';
import { JwtPayload, SocketWithUser } from '../auth.types';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<SocketWithUser>();

    this.verify(client);

    return true;
  }

  verify(client: SocketWithUser): JwtPayload {
    const token = this.extractToken(client);

    if (!token) {
      throw new WsException('Токен не предоставлен');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.jwtConfiguration.accessSecret,
      });

      client.data.user = payload;

      return payload;
    } catch {
      throw new WsException('Невалидный или просроченный токен');
    }
  }

  private extractToken(client: SocketWithUser): string | undefined {
    const token = client.handshake.query?.token;

    return typeof token === 'string' ? token : undefined;
  }
}
