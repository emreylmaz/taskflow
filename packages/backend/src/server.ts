import app from './app.js'
import { env } from './config/env.js'
import { prisma } from './config/database.js'
import { logger } from './utils/logger.js'

const PORT = env.PORT

const server = app.listen(PORT, () => {
  logger.info({
    port: PORT,
    env: env.NODE_ENV,
    url: `http://localhost:${PORT}`,
  }, 'TaskFlow API server started')
})

function gracefulShutdown(signal: string) {
  logger.info({ signal }, 'Shutdown signal received, closing gracefully...')
  
  server.close(async () => {
    await prisma.$disconnect()
    logger.info('Database disconnected, server closed')
    process.exit(0)
  })

  // 10 saniye içinde kapanmazsa zorla kapat
  setTimeout(() => {
    logger.error('Graceful shutdown timeout, forcing exit')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Uncaught exception handler
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception')
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled rejection')
  process.exit(1)
})
