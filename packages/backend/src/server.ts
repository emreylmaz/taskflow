import app from './app.js'
import { env } from './config/env.js'

const PORT = env.PORT

app.listen(PORT, () => {
  console.log(`🚀 TaskFlow API running on http://localhost:${PORT}`)
  console.log(`📝 Environment: ${env.NODE_ENV}`)
})
