import * as Sentry from '@sentry/node'
import { json, urlencoded } from 'body-parser'
import compression from 'compression'
import cors from 'cors'
import express, { Router } from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  conflict,
  created,
  error,
  forbidden,
  notFound,
  ok,
  unauthorized
} from './utils/express-helper'
import authRouter from './services/auth/router'
import mastersRouter from './services/masters/router'
import tradeRouter from './services/trade/router'
require('dotenv').config()

// create express server
export const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Sentry Middleware
app.use(Sentry.Handlers.requestHandler())
app.use(Sentry.Handlers.tracingHandler())

app.disable('x-powered-by')

app.use(cors())
app.use(json())
app.use(express.static(__dirname))
app.use(urlencoded({ extended: true }))
app.use(morgan('dev'))

// gzip comperssion
// only compress non-EventStream responses
const compress = compression({
  filter: (req, res) => {
    const accept = req.headers['accept'] || ''
    if (accept.includes('text/event-stream')) {
      // skip compressing SSE endpoints
      return false
    }
    return compression.filter(req, res)
  }
})

app.use(compress)

// security guard
app.use(helmet())

const router = Router()
router.use(created, error, unauthorized, ok, conflict, forbidden, notFound)
app.use(created, error, unauthorized, ok, conflict, forbidden, notFound)

router.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept')
  res.header('Access-Control-Max-Age', '1728000')
  next()
})

// API Routes
app.use('/api/auth', authRouter)
app.use('/api/masters', mastersRouter)
app.use('/api/trades', tradeRouter)

// Source:  https://docs.sentry.io/platforms/node/guides/express/
app.use(Sentry.Handlers.errorHandler())
