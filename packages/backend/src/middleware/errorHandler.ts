import type { Request, Response, NextFunction } from 'express'
import { ApiError } from '../utils/ApiError.js'

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error('❌ Error:', err.message)

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      message: err.message,
    })
    return
  }

  res.status(500).json({
    message: 'Sunucu hatası',
  })
}
