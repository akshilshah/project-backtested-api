import 'dotenv/config'

const config = {
  SECRETS: {
    JWT: process.env.JWT_SECRET,
    JWTEXP: process.env.JWT_EXPIRY_DATE
  },
  DEBUG: true,
  EMAIL: false,
  SMS: false,
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  CACHE: process.env.CACHE,
  DEBUG_LLM: process.env.DEBUG_LLM,
  WEB_BASE_URL: process.env.WEB_BASE_URL,
  REDIS_URL: process.env.REDIS_URL
}

export default config
