import * as Sentry from '@sentry/node'
import * as Tracing from '@sentry/tracing'
import { app } from './app'
import config from './config'
import { db } from './config/db'
import { redis } from './config/redis'

require('dotenv').config()

const start = async () => {
  try {
    Sentry.init({
      dsn: process.env.SENTRY_URL,
      integrations: [
        // enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // enable Express.js middleware tracing
        new Tracing.Integrations.Express({ app })
      ],

      tracesSampleRate: 1.0
    })
    await db.$connect()

    if (config.CACHE === 'true') {
      console.log('Redis Server already connected via redis.js module')
    }

    app.listen(config.PORT, () => {
      console.log(`REST API on http://localhost:${config.PORT}/api`)
    })
  } catch (e) {
    await db.$disconnect()
    // await redis.disconnect()
    console.error(e)
  }
}

start()
