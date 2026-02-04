import app from './app.js'
import { env } from './config/env.js'
import { prisma } from './config/database.js'

const PORT = env.PORT

const server = app.listen(PORT, () => {
  console.log(`🚀 TaskFlow API running on http://localhost:${PORT}`)
  console.log(`📝 Environment: ${env.NODE_ENV}`)
})

function gracefulShutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`)
  server.close(async () => {
    await prisma.$disconnect()
    console.log('Server closed')
    process.exit(0)
  })
  setTimeout(() => {
    console.error('Forced shutdown')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
