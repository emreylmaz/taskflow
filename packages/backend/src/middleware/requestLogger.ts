import pinoHttp from 'pino-http'
import { logger } from '../utils/logger.js'
import type { Request, Response } from 'express'

/**
 * HTTP Request Logger Middleware
 * Her isteği otomatik loglar: method, url, status, duration
 */
export const requestLogger = pinoHttp({
  logger,

  // Request'e özgü bilgileri ekle
  customProps: (req: Request) => ({
    // Authenticated user varsa ekle
    ...(req.user && { userId: (req.user as { userId?: string }).userId }),
  }),

  // Hangi field'lar loglanacak
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      // Headers'dan hassas bilgileri çıkar
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
      },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },

  // Custom log message
  customSuccessMessage: (req: Request, res: Response) => {
    return `${req.method} ${req.url} ${res.statusCode}`
  },

  customErrorMessage: (req: Request, res: Response) => {
    return `${req.method} ${req.url} ${res.statusCode}`
  },

  // Response time threshold for slow requests (500ms)
  customLogLevel: (_req: Request, res: Response, err?: Error) => {
    if (err || res.statusCode >= 500) return 'error'
    if (res.statusCode >= 400) return 'warn'
    return 'info'
  },

  // Health check endpoint'lerini loglama
  autoLogging: {
    ignore: (req: Request) => {
      return req.url === '/api/health' || req.url === '/health'
    },
  },
})
