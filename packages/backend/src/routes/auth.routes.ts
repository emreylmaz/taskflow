import { Router } from 'express'
import type { Request, Response, NextFunction, CookieOptions } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate.js'
import * as authService from '../services/auth.service.js'
import { ApiError } from '../utils/ApiError.js'
import { env } from '../config/env.js'

const router = Router()

// ── Cookie Options ─────────────────────────────────────

function getRefreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  }
}

// ── Validation Schemas ─────────────────────────────────

const registerSchema = z.object({
  name: z.string().min(2, 'Ad en az 2 karakter olmalı'),
  email: z.string().email('Geçerli bir e-posta girin'),
  password: z.string()
    .min(8, 'Şifre en az 8 karakter olmalı')
    .regex(/[A-Z]/, 'En az bir büyük harf gerekli')
    .regex(/[a-z]/, 'En az bir küçük harf gerekli')
    .regex(/[0-9]/, 'En az bir rakam gerekli')
    .regex(/[^A-Za-z0-9]/, 'En az bir özel karakter gerekli'),
})

const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta girin'),
  password: z.string().min(1, 'Şifre gerekli'),
})

// ── Routes ─────────────────────────────────────────────

// POST /api/auth/register
router.post(
  '/register',
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.register(req.body)
      res.status(201).json({ message: 'Kayıt başarılı', user })
    } catch (err) {
      next(err)
    }
  },
)

// POST /api/auth/login
router.post(
  '/login',
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body)

      res.cookie('refreshToken', result.refreshToken, getRefreshCookieOptions())
      res.json({ accessToken: result.accessToken, user: result.user })
    } catch (err) {
      next(err)
    }
  },
)

// POST /api/auth/refresh
router.post(
  '/refresh',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.refreshToken
      if (!refreshToken) {
        throw ApiError.unauthorized('Refresh token bulunamadı')
      }

      const tokens = await authService.refresh(refreshToken)

      res.cookie('refreshToken', tokens.refreshToken, getRefreshCookieOptions())
      res.json({ accessToken: tokens.accessToken })
    } catch (err) {
      next(err)
    }
  },
)

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('refreshToken', { path: '/api/auth' })
  res.json({ message: 'Çıkış yapıldı' })
})

export default router
