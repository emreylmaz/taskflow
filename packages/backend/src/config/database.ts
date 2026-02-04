import { PrismaClient } from '@prisma/client'

// Prisma Client singleton — her import'ta aynı instance kullanılır.
// Bu pattern, dev server restart'larında connection leak'i önler.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query', 'error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
