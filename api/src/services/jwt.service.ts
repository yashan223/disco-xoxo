import jwt from 'jsonwebtoken';
import { env } from '../utils/env';

export interface JWTPayload {
  userId: string;         // MongoDB _id
  discordId: string;
  username: string;
  iat?: number;
  exp?: number;
}

const TOKEN_EXPIRY = '7d';

export const jwtService = {
  sign(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  },

  verify(token: string): JWTPayload {
    return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
  },

  decode(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch {
      return null;
    }
  },
};
