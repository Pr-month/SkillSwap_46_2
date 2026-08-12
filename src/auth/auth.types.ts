import { Request } from 'express';
import { Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { Role } from '../shared/enums/role.enum';

export type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
};

export type SocketData = {
  user: JwtPayload;
};

export type SocketWithUser = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  SocketData
>;

export type RequestWithUser = Request & {
  user: JwtPayload;
};

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  city?: string | null;
  about?: string | null;
  birthdate?: string | null;
  avatar?: string | null;
};

export type AuthResult = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type RequestWithRefreshToken = Request & {
  user: JwtPayload & { refreshToken: string };
};
