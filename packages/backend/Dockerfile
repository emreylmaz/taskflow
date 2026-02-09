# ══════════════════════════════════════════════════════════════════════════════
# TaskFlow Backend — Production Dockerfile
# Multi-stage build: Builder → Runner
# ══════════════════════════════════════════════════════════════════════════════

# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# Gerekli araçlar (prisma için)
RUN apk add --no-cache openssl

WORKDIR /app

# Dependency dosyalarını kopyala (cache optimizasyonu)
COPY package.json package-lock.json* pnpm-lock.yaml* ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/shared/package.json ./packages/shared/

# pnpm veya npm ile install
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile || npm ci

# Shared package'ı kopyala ve build et
COPY packages/shared ./packages/shared
RUN cd packages/shared && pnpm build || npm run build

# Backend source'u kopyala
COPY packages/backend ./packages/backend

# Prisma generate
RUN cd packages/backend && npx prisma generate

# TypeScript build
RUN cd packages/backend && pnpm build || npm run build

# Production dependencies only
RUN pnpm prune --prod || npm prune --production

# ── Stage 2: Runner ───────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

# Güvenlik: non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 taskflow

# Gerekli runtime dependencies
RUN apk add --no-cache openssl curl

WORKDIR /app

# Production dosyalarını kopyala
COPY --from=builder --chown=taskflow:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=taskflow:nodejs /app/packages/backend/dist ./dist
COPY --from=builder --chown=taskflow:nodejs /app/packages/backend/package.json ./
COPY --from=builder --chown=taskflow:nodejs /app/packages/backend/prisma ./prisma
COPY --from=builder --chown=taskflow:nodejs /app/packages/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=taskflow:nodejs /app/packages/shared/dist ./node_modules/@taskflow/shared/dist
COPY --from=builder --chown=taskflow:nodejs /app/packages/shared/package.json ./node_modules/@taskflow/shared/

# Non-root user'a geç
USER taskflow

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Port expose
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

# Startup: migrate + start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
