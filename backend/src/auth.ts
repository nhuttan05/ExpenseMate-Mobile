import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { config } from './config';
import { query } from './db';
import { ApiError } from './errors';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
}

interface UserRow extends PublicUser {
  password_hash: string;
}

interface RefreshTokenRow {
  user_id: string;
  expires_at: Date;
  revoked_at: Date | null;
}

const publicUser = (user: PublicUser): PublicUser => ({ id: user.id, name: user.name, email: user.email });
const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

const signToken = (payload: Record<string, string>, secret: string, expiresIn: string) =>
  jwt.sign(payload, secret, { expiresIn: expiresIn as SignOptions['expiresIn'] });

const ttlToMilliseconds = (ttl: string): number => {
  const match = ttl.match(/^(\d+)([smhd])$/);
  if (!match) return 30 * 24 * 60 * 60 * 1000;
  const values: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return Number(match[1]) * values[match[2]];
};

export const createTokens = async (user: PublicUser) => {
  const accessToken = signToken({ sub: user.id, type: 'access' }, config.JWT_ACCESS_SECRET, config.ACCESS_TOKEN_TTL);
  const refreshToken = signToken(
    { sub: user.id, type: 'refresh', jti: crypto.randomUUID() },
    config.JWT_REFRESH_SECRET,
    config.REFRESH_TOKEN_TTL
  );
  const expiresAt = new Date(Date.now() + ttlToMilliseconds(config.REFRESH_TOKEN_TTL));

  await query('INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)', [user.id, hashToken(refreshToken), expiresAt]);
  return { accessToken, refreshToken };
};

export const revokeRefreshToken = async (token: string): Promise<void> => {
  await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL', [hashToken(token)]);
};

export const verifyRefreshToken = async (token: string): Promise<PublicUser> => {
  let decoded: JwtPayload & { sub?: string; type?: string };
  try {
    decoded = jwt.verify(token, config.JWT_REFRESH_SECRET) as JwtPayload & { sub?: string; type?: string };
  } catch {
    throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token không hợp lệ hoặc đã hết hạn.');
  }

  if (!decoded.sub || decoded.type !== 'refresh') throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token không hợp lệ.');
  const tokenResult = await query<RefreshTokenRow>('SELECT user_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = $1', [hashToken(token)]);
  const storedToken = tokenResult.rows[0];
  if (!storedToken || storedToken.revoked_at || new Date(storedToken.expires_at) <= new Date()) {
    throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token không hợp lệ hoặc đã bị thu hồi.');
  }

  const userResult = await query<PublicUser>('SELECT id, name, email FROM users WHERE id = $1', [decoded.sub]);
  const user = userResult.rows[0];
  if (!user) throw new ApiError(401, 'USER_NOT_FOUND', 'Tài khoản không còn tồn tại.');
  return publicUser(user);
};

export const registerUser = async (name: string, email: string, password: string): Promise<PublicUser> => {
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const result = await query<PublicUser>('INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email', [name, email, passwordHash]);
    return publicUser(result.rows[0]);
  } catch (error: any) {
    if (error?.code === '23505') throw new ApiError(409, 'EMAIL_ALREADY_EXISTS', 'Email đã được đăng ký.');
    throw error;
  }
};

export const loginUser = async (email: string, password: string): Promise<PublicUser> => {
  const result = await query<UserRow>('SELECT id, name, email, password_hash FROM users WHERE email = $1', [email]);
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng.');
  }
  return publicUser(user);
};

export const getUserById = async (id: string): Promise<PublicUser> => {
  const result = await query<PublicUser>('SELECT id, name, email FROM users WHERE id = $1', [id]);
  const user = result.rows[0];
  if (!user) throw new ApiError(404, 'USER_NOT_FOUND', 'Không tìm thấy tài khoản.');
  return publicUser(user);
};
