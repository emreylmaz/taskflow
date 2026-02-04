import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import authRoutes from './routes/auth.routes.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()

// ── Security Middleware ────────────────────────────────
app.use(helmet())                          // Security headers
app.use(cors({ origin: 'http://localhost:3000', credentials: true }))

// ── Body Parsing ───────────────────────────────────────
app.use(express.json())

// ── Health Check ───────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes)

// ── Error Handler (must be last) ───────────────────────
app.use(errorHandler)

export default app
