import { NextFunction, Request, Response } from 'express';

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction) => {
  next(new ApiError(404, 'NOT_FOUND', 'Endpoint không tồn tại.'));
};

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({ error: { code: error.code, message: error.message, details: error.details } });
    return;
  }

  console.error(error);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Đã xảy ra lỗi máy chủ.' } });
};
