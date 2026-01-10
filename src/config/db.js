import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const { PrismaClient } = require('./prisma/generated')

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})
export const db = new PrismaClient({ adapter })
