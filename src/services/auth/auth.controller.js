import { db } from '../../config/db'
import {
  compareHash,
  generateJWTToken,
  hashText,
  verifyJWTToken
} from '../../utils/utils'
import {
  loginSchema,
  signupSchema,
  updateProfileSchema,
  updateSettingsSchema
} from '../../utils/validation'

/**
 * User Signup
 * POST /api/auth/signup
 */
export const signup = async (req, res) => {
  try {
    const body = await signupSchema.validateAsync(req.body)
    console.log(body)
    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: { email: body.email }
    })

    if (existingUser) {
      return res.conflict('User with this email already exists')
    }

    // Hash password
    const hashedPassword = await hashText(body.password)

    // Create organization and user in a transaction
    const result = await db.$transaction(async tx => {
      // Create default organization for user
      const organization = await tx.organization.create({
        data: {
          name: `${body.firstName}'s Organization`,
          description: 'Default organization'
        }
      })

      // Create user
      const user = await tx.user.create({
        data: {
          email: body.email,
          password: hashedPassword,
          firstName: body.firstName,
          lastName: body.lastName,
          organizationId: organization.id
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          organizationId: true
        }
      })

      // Create default user settings
      await tx.userSettings.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          currency: 'USD',
          timezone: 'UTC'
        }
      })

      return user
    })

    // Generate JWT token
    const token = await generateJWTToken({
      id: result.id,
      organizationId: result.organizationId
    })

    res.created({
      message: 'User created successfully',
      user: result,
      token
    })
  } catch (error) {
    console.log('Signup error:', error)
    console.log(
      'Error cause:',
      JSON.stringify(error.meta?.driverAdapterError?.cause, null, 2)
    )
    res.error(error)
  }
}

/**
 * User Login
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const body = await loginSchema.validateAsync(req.body)

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: body.email },
      include: {
        organization: true
      }
    })

    if (!user) {
      return res.unauthorized('Invalid email or password')
    }

    // Verify password
    const isValidPassword = await compareHash(body.password, user.password)
    if (!isValidPassword) {
      return res.unauthorized('Invalid email or password')
    }

    // Generate JWT token
    const token = await generateJWTToken({
      id: user.id,
      organizationId: user.organizationId
    })

    res.ok({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        organization: user.organization
      },
      token
    })
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}

/**
 * Get User Profile
 * GET /api/auth/profile
 */
export const getProfile = async (req, res) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.context.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profileSettings: true,
        organization: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        userSettings: {
          select: {
            currency: true,
            timezone: true,
            preferences: true
          }
        }
      }
    })

    if (!user) {
      return res.notFound('User not found')
    }

    res.ok(user)
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}

/**
 * Update User Profile
 * PUT /api/auth/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const body = await updateProfileSchema.validateAsync(req.body)

    const user = await db.user.update({
      where: { id: req.context.user.id },
      data: body,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profileSettings: true
      }
    })

    res.ok({
      message: 'Profile updated successfully',
      user
    })
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}

/**
 * Update User Settings
 * PUT /api/auth/settings
 */
export const updateSettings = async (req, res) => {
  try {
    const body = await updateSettingsSchema.validateAsync(req.body)

    // Check if settings exist
    let settings = await db.userSettings.findUnique({
      where: { userId: req.context.user.id }
    })

    if (!settings) {
      // Create settings if they don't exist
      settings = await db.userSettings.create({
        data: {
          userId: req.context.user.id,
          organizationId: req.context.organization.id,
          ...body
        }
      })
    } else {
      // Update existing settings
      settings = await db.userSettings.update({
        where: { userId: req.context.user.id },
        data: body
      })
    }

    res.ok({
      message: 'Settings updated successfully',
      settings: {
        currency: settings.currency,
        timezone: settings.timezone,
        preferences: settings.preferences
      }
    })
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}

/**
 * Auth Middleware - Protect routes
 * Verifies JWT token and attaches user context to request
 */
export const protect = async (req, res, next) => {
  try {
    const bearer = req.headers.authorization || req.headers.Authorization

    if (!bearer || !bearer.startsWith('Bearer ')) {
      return res.unauthorized('Access denied. No token provided.')
    }

    const token = bearer.split('Bearer ')[1].trim()
    const payload = verifyJWTToken(token)

    if (!payload) {
      return res.unauthorized('Invalid or expired token')
    }

    // Fetch user with organization
    const user = await db.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!user) {
      return res.unauthorized('User not found')
    }

    // Attach context to request
    req.context = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      organization: {
        id: user.organization.id,
        name: user.organization.name
      }
    }

    next()
  } catch (error) {
    console.log(error)
    res.unauthorized('Authentication failed')
  }
}
