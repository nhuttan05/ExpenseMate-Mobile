import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { config } from '../config';
import { ApiError } from '../errors';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const authorization = req.header('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
  if (!token) return next(new ApiError(401, 'UNAUTHORIZED', 'Cần đăng nhập để thực hiện thao tác này.'));

  try {
    const payload = jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtPayload & { sub?: string; type?: string };
    if (!payload.sub || payload.type !== 'access') throw new Error('Invalid access token');
    req.user = { id: payload.sub };
    next();
  } catch {
    next(new ApiError(401, 'INVALID_ACCESS_TOKEN', 'Access token không hợp lệ hoặc đã hết hạn.'));
  }
};
