import { Request } from 'express';
import { Role } from '../shared/enums/role.enum';

export type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
};

export type RequestWithUser = Request & {
  user: JwtPayload;
};
