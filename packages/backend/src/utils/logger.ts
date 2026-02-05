import pino from 'pino'
import { env } from '../config/env.js'

/**
 * Structured Logger - pino ile merkezi loglama
 * 
 * Kullanım:
 *   import { logger } from './utils/logger.js'
 *   logger.info('mesaj')
 *   logger.info({ userId: '123' }, 'User logged in')
 *   logger.error({ err }, 'Something went wrong')
 */

const isDevelopment = env.NODE_ENV !== 'production'

export const logger = pino({
  level: env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  
  // Development'ta okunabilir format
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,

  // Production'da JSON formatında, ek metadata ile
  ...(isDevelopment
    ? {}
    : {
        formatters: {
          level: (label: string) => ({ level: label }),
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      }),

  // Tüm log'lara eklenecek base fields
  base: {
    service: 'taskflow-backend',
    version: process.env.npm_package_version || '0.1.0',
  },

  // Error serialization
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
})

// Child logger oluşturma helper'ı
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context)
}

export default logger
