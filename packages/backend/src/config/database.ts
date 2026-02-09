import { PrismaClient } from "@prisma/client";

// Prisma Client singleton — her import'ta aynı instance kullanılır.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "production"
        ? ["error", "warn"]
        : ["query", "error", "warn"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Her ortamda singleton'u koru (production dahil)
globalForPrisma.prisma = prisma;
