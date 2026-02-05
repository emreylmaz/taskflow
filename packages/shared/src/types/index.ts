// ── User Types ──────────────────────────────────────────

export interface User {
  id: string
  name: string
  email: string
  avatar?: string | null
  createdAt?: Date
  updatedAt?: Date
}

export interface UserWithPassword extends User {
  password: string
  failedLoginAttempts: number
  lockoutUntil: Date | null
}

// ── Auth Types ──────────────────────────────────────────

export interface AuthResponse {
  accessToken: string
  user: User
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface RefreshResponse {
  accessToken: string
  user: User
}

// ── JWT Types ───────────────────────────────────────────

export interface TokenPayload {
  userId: string
  email: string
  iss?: string  // issuer
  aud?: string  // audience
  jti?: string  // JWT ID
}

// ── API Error Types ─────────────────────────────────────

export interface ApiErrorResponse {
  message: string
  code?: string
  statusCode: number
  errors?: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
}

// ── Health Check Types ──────────────────────────────────

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error'
  timestamp: string
  database?: {
    status: 'ok' | 'error'
    latencyMs?: number
  }
  version?: string
}
