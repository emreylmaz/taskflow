import type { Request, Response, NextFunction } from 'express'
import { ApiError } from '../utils/ApiError.js'
import { logger } from '../utils/logger.js'

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  // ApiError'lar beklenen hatalar, sadece warn seviyesinde logla
  if (err instanceof ApiError) {
    logger.warn({
      err,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    }, err.message)

    res.status(err.statusCode).json({
      message: err.message,
    })
    return
  }

  // Beklenmeyen hatalar error seviyesinde logla (stack trace ile)
  logger.error({
    err,
    path: req.path,
    method: req.method,
    body: req.body,
  }, 'Unexpected error occurred')

  res.status(500).json({
    message: 'Sunucu hatası',
  })
}
