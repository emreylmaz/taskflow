import type { Request, Response, NextFunction } from 'express'
import type { ZodSchema } from 'zod'
import { ApiError } from '../utils/ApiError.js'

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      const message = result.error.errors.map(e => e.message).join(', ')
      throw ApiError.badRequest(message)
    }

    req.body = result.data
    next()
  }
}
