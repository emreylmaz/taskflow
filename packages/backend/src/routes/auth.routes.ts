import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate.js'
import * as authService from '../services/auth.service.js'

const router = Router()

// ── Validation Schemas ─────────────────────────────────

const registerSchema = z.object({
  name: z.string().min(2, 'Ad en az 2 karakter olmalı'),
  email: z.string().email('Geçerli bir e-posta girin'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalı'),
})

const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta girin'),
  password: z.string().min(1, 'Şifre gerekli'),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token gerekli'),
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
      res.json(result)
    } catch (err) {
      next(err)
    }
  },
)

// POST /api/auth/refresh
router.post(
  '/refresh',
  validate(refreshSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokens = await authService.refresh(req.body.refreshToken)
      res.json(tokens)
    } catch (err) {
      next(err)
    }
  },
)

export default router
