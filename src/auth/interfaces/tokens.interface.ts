import { Role } from '#db';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: number;
  email: string;
  role: Role;
}
