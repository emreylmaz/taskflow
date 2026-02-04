import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt.js'
import { ApiError } from '../utils/ApiError.js'

// Express Request'e userId ve email ekle
declare module 'express' {
  interface Request {
    userId?: string
    userEmail?: string
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Token bulunamadı')
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = verifyAccessToken(token)
    req.userId = payload.userId
    req.userEmail = payload.email
    next()
  } catch {
    throw ApiError.unauthorized('Geçersiz veya süresi dolmuş token')
  }
}
