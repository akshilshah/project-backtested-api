import { createClient } from 'redis'
import config from './index.js'

export const redis = createClient({ url: config.REDIS_URL })

// Connect to Redis
redis.on('error', err => console.error('Redis Client Error:', err))
redis.on('connect', () => console.log('✅ Redis Client Connected'))
redis.on('ready', () => console.log('✅ Redis Client Ready'))

// Establish connection
;(async () => {
  try {
    if (!redis.isOpen) {
      await redis.connect()
      console.log('✅ Redis connection established')
    }
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error.message)
  }
})()
