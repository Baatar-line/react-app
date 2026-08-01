export type Role = 'user' | 'admin';

export interface JwtPayload {
  userId: number;
  role: Role;
}
