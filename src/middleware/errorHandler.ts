import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/index.js';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  const response: ApiResponse = {
    success: false,
    error: err.message || 'Internal server error'
  };

  const statusCode = (err as any).statusCode || 500;
  res.status(statusCode).json(response);
};

export const notFoundHandler = (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: false,
    error: 'Route not found'
  };
  res.status(404).json(response);
};
