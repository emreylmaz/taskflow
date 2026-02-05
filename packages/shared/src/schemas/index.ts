import { z } from 'zod'

// ── Auth Schemas ────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta girin'),
  password: z.string().min(1, 'Şifre gerekli'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Ad en az 2 karakter olmalı'),
  email: z.string().email('Geçerli bir e-posta girin'),
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalı')
    .regex(/[A-Z]/, 'En az bir büyük harf gerekli')
    .regex(/[a-z]/, 'En az bir küçük harf gerekli')
    .regex(/[0-9]/, 'En az bir rakam gerekli')
    .regex(/[^A-Za-z0-9]/, 'En az bir özel karakter gerekli'),
})

// ── User Schemas ────────────────────────────────────────

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().nullable().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
})

// ── Response Schemas ────────────────────────────────────

export const authResponseSchema = z.object({
  accessToken: z.string(),
  user: userSchema,
})

export const apiErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  statusCode: z.number(),
  errors: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
      }),
    )
    .optional(),
})

// ── Type exports from schemas ───────────────────────────

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type UserDTO = z.infer<typeof userSchema>
export type AuthResponseDTO = z.infer<typeof authResponseSchema>
export type ApiErrorDTO = z.infer<typeof apiErrorSchema>
