import { db } from '../config/db'
import { compareHash, generateJWTToken, verifyJWTToken } from './utils'
import { authSchema } from './validation'

export const login = async (req, res) => {
  try {
    await authSchema.validateAsync(req.body)

    let { email, password } = req.body

    const user = await db.user.findUnique({
      where: {
        email
      }
    })
    // TODO: if no user found send error
    const validatePassword = await compareHash(password, user.password)
    if (!validatePassword) {
      return res.unauthorized('Either email or password is invalid')
    }
    const token = await generateJWTToken({ id: user.id })

    res.ok({ message: 'Login Success', token })
  } catch (error) {
    // if (error.isJoi === true) res.error(error)
    res.error(error)
  }
}

export const protect = async (req, res, next) => {
  const bearer = req.headers.authorization || req.headers.Authorization
  if (!bearer || !bearer.startsWith('Bearer ')) {
    return res.unauthorized()
  }
  const token = bearer.split('Bearer ')[1].trim()

  const payload = verifyJWTToken(token)
  if (!payload) {
    return res.unauthorized()
  }
  const user = await db.user.findUnique({
    where: { id: payload.id },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      id: true
    }
  })

  req.user = user
  next()
}

export const authByd = async (req, res, next) => {
  const token = req.headers.authorization || req.headers.Authorization
  if (!token) {
    return res.unauthorized()
  }

  const verify = token === process.env.BYD_API_AUTH_TOKEN
  if (!verify) {
    return res.unauthorized()
  }

  next()
}

export const authAfg = async (req, res, next) => {
  const token = req.headers.authorization || req.headers.Authorization
  if (!token) {
    return res.unauthorized()
  }

  const verify = token === process.env.AFG_API_AUTH_TOKEN
  if (!verify) {
    return res.unauthorized()
  }

  next()
}

export const authAlb = async (req, res, next) => {
  const token = req.headers.authorization || req.headers.Authorization
  if (!token) {
    return res.unauthorized()
  }

  const verify = token === process.env.ALB_API_AUTH_TOKEN
  if (!verify) {
    return res.unauthorized()
  }

  next()
}

export const authAb = async (req, res, next) => {
  const token = req.headers.authorization || req.headers.Authorization
  if (!token) {
    return res.unauthorized()
  }

  const verify = token === process.env.AB_API_AUTH_TOKEN
  if (!verify) {
    return res.unauthorized()
  }

  next()
}
