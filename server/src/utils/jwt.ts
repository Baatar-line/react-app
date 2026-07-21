import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: number;
  role: 'user' | 'host' | 'admin';
}

const secret = process.env.JWT_SECRET;
if (!secret) throw new Error('JWT_SECRET is not set — copy .env.example to .env and fill it in.');

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, secret as string, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, secret as string) as JwtPayload;
}
