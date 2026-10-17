import jwt from 'jsonwebtoken';
import { AuthUserPayload } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'careq-super-secret-jwt-key-2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function signToken(payload: AuthUserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): AuthUserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUserPayload;
  } catch (error) {
    return null;
  }
}
