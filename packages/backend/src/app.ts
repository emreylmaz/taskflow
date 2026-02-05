import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import authRoutes from './routes/auth.routes.js'
import { errorHandler } from './middleware/errorHandler.js'
import { env } from './config/env.js'

const app = express()

// ── Security Middleware ────────────────────────────────
app.use(helmet())                          // Security headers
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}))

// ── Body Parsing ───────────────────────────────────────
app.use(express.json({ limit: '10kb' }))
app.use(cookieParser())

// ── Rate Limiting (test ortamında devre dışı) ──────────
if (env.NODE_ENV !== 'test') {
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Çok fazla istek, lütfen daha sonra tekrar deneyin' },
  })

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Çok fazla giriş denemesi, 15 dakika sonra tekrar deneyin' },
  })

  app.use(globalLimiter)
  app.post('/api/auth/login', authLimiter)
  app.post('/api/auth/register', authLimiter)
}

// ── Health Check ───────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes)

// ── Error Handler (must be last) ───────────────────────
app.use(errorHandler)

export default app
