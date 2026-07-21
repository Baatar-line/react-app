export type Role = 'user' | 'host' | 'admin';

export interface JwtPayload {
  userId: number;
  role: Role;
}
