export type JwtPayload = {
  sub: number;
  email: string;
  role: 'USER' | 'ADMIN';
};
