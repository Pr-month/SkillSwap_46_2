import { Request } from 'express';

export type JwtPayload = {
  sub: string;
  email: string;
  role: 'USER' | 'ADMIN';
};

export type RequestWithUser = Request & {
  user: JwtPayload;
};
