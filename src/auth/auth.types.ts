import { Role } from '../shared/enums/role.enum';

export type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
};

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
  name: string;
};

export type AuthResult = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type RequestWithRefreshToken = Request & {
  user: JwtPayload & { refreshToken: string };
};

export type AuthResponse = {
  user: JwtPayload;
};
