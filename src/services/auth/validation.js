import Joi from 'joi'

export const signupSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required'
    }),
  firstName: Joi.string()
    .required()
    .messages({
      'any.required': 'First name is required'
    }),
  lastName: Joi.string()
    .required()
    .messages({
      'any.required': 'Last name is required'
    })
})

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
})

export const updateProfileSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  profileSettings: Joi.object().optional()
})

export const updateSettingsSchema = Joi.object({
  currency: Joi.string().optional(),
  timezone: Joi.string().optional(),
  preferences: Joi.object().optional()
})
