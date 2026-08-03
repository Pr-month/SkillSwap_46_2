import { Role } from '../shared/enums/role.enum';

export type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
};
