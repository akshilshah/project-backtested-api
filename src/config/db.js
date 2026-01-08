/*
    Connect to datatbase
*/

import 'dotenv/config'
import { PrismaClient } from '../../prisma/generated/client.js'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
export const db = new PrismaClient({ adapter })
