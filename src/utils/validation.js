import Joi from 'joi'

// =============================================================================
// AUTH SCHEMAS
// =============================================================================

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

// =============================================================================
// COIN SCHEMAS
// =============================================================================

export const createCoinSchema = Joi.object({
  name: Joi.string().required().trim().min(1).max(100),
  symbol: Joi.string().required().trim().uppercase().min(1).max(20),
  description: Joi.string().allow('', null).max(500)
})

export const updateCoinSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100),
  symbol: Joi.string().trim().uppercase().min(1).max(20),
  description: Joi.string().allow('', null).max(500)
}).min(1)

// =============================================================================
// STRATEGY SCHEMAS
// =============================================================================

export const createStrategySchema = Joi.object({
  name: Joi.string().required().trim().min(1).max(100),
  description: Joi.string().allow('', null).max(1000),
  rules: Joi.object().allow(null)
})

export const updateStrategySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100),
  description: Joi.string().allow('', null).max(1000),
  rules: Joi.object().allow(null)
}).min(1)

// =============================================================================
// TRADE SCHEMAS
// =============================================================================

export const createTradeSchema = Joi.object({
  coinId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Coin ID must be a number',
      'number.integer': 'Coin ID must be an integer',
      'number.positive': 'Coin ID must be positive',
      'any.required': 'Coin ID is required'
    }),
  strategyId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Strategy ID must be a number',
      'number.integer': 'Strategy ID must be an integer',
      'number.positive': 'Strategy ID must be positive',
      'any.required': 'Strategy ID is required'
    }),
  tradeDate: Joi.date()
    .iso()
    .required()
    .messages({
      'date.base': 'Trade date must be a valid date',
      'date.format': 'Trade date must be in ISO format',
      'any.required': 'Trade date is required'
    }),
  tradeTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
    .required()
    .messages({
      'string.pattern.base': 'Trade time must be in HH:mm:ss format',
      'any.required': 'Trade time is required'
    }),
  avgEntry: Joi.number()
    .positive()
    .required()
    .messages({
      'number.base': 'Average entry must be a number',
      'number.positive': 'Average entry must be positive',
      'any.required': 'Average entry is required'
    }),
  stopLoss: Joi.number()
    .positive()
    .required()
    .messages({
      'number.base': 'Stop loss must be a number',
      'number.positive': 'Stop loss must be positive',
      'any.required': 'Stop loss is required'
    }),
  stopLossPercentage: Joi.number()
    .positive()
    .required()
    .messages({
      'number.base': 'Stop loss percentage must be a number',
      'number.positive': 'Stop loss percentage must be positive',
      'any.required': 'Stop loss percentage is required'
    }),
  quantity: Joi.number()
    .positive()
    .required()
    .messages({
      'number.base': 'Quantity must be a number',
      'number.positive': 'Quantity must be positive',
      'any.required': 'Quantity is required'
    }),
  amount: Joi.number()
    .positive()
    .required()
    .messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive',
      'any.required': 'Amount is required'
    }),
  notes: Joi.string()
    .allow('')
    .optional()
})

export const updateTradeSchema = Joi.object({
  coinId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'Coin ID must be a number',
      'number.integer': 'Coin ID must be an integer',
      'number.positive': 'Coin ID must be positive'
    }),
  strategyId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'Strategy ID must be a number',
      'number.integer': 'Strategy ID must be an integer',
      'number.positive': 'Strategy ID must be positive'
    }),
  tradeDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'Trade date must be a valid date',
      'date.format': 'Trade date must be in ISO format'
    }),
  tradeTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
    .optional()
    .messages({
      'string.pattern.base': 'Trade time must be in HH:mm:ss format'
    }),
  avgEntry: Joi.number()
    .positive()
    .optional()
    .messages({
      'number.base': 'Average entry must be a number',
      'number.positive': 'Average entry must be positive'
    }),
  stopLoss: Joi.number()
    .positive()
    .optional()
    .messages({
      'number.base': 'Stop loss must be a number',
      'number.positive': 'Stop loss must be positive'
    }),
  stopLossPercentage: Joi.number()
    .positive()
    .optional()
    .messages({
      'number.base': 'Stop loss percentage must be a number',
      'number.positive': 'Stop loss percentage must be positive'
    }),
  quantity: Joi.number()
    .positive()
    .optional()
    .messages({
      'number.base': 'Quantity must be a number',
      'number.positive': 'Quantity must be positive'
    }),
  amount: Joi.number()
    .positive()
    .optional()
    .messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive'
    }),
  notes: Joi.string()
    .allow('')
    .optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
})

export const exitTradeSchema = Joi.object({
  avgExit: Joi.number()
    .positive()
    .required()
    .messages({
      'number.base': 'Average exit must be a number',
      'number.positive': 'Average exit must be positive',
      'any.required': 'Average exit is required'
    }),
  exitDate: Joi.date()
    .iso()
    .required()
    .messages({
      'date.base': 'Exit date must be a valid date',
      'date.format': 'Exit date must be in ISO format',
      'any.required': 'Exit date is required'
    }),
  exitTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
    .required()
    .messages({
      'string.pattern.base': 'Exit time must be in HH:mm:ss format',
      'any.required': 'Exit time is required'
    }),
  notes: Joi.string()
    .allow('')
    .optional()
})

export const listTradesSchema = Joi.object({
  status: Joi.string()
    .valid('OPEN', 'CLOSED')
    .optional()
    .messages({
      'any.only': 'Status must be either OPEN or CLOSED'
    }),
  coinId: Joi.number()
    .integer()
    .positive()
    .optional(),
  strategyId: Joi.number()
    .integer()
    .positive()
    .optional(),
  dateFrom: Joi.date()
    .iso()
    .optional(),
  dateTo: Joi.date()
    .iso()
    .optional(),
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),
  sortBy: Joi.string()
    .valid('tradeDate', 'createdAt', 'profitLoss', 'profitLossPercentage')
    .default('tradeDate'),
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
})

export const analyticsSchema = Joi.object({
  dateFrom: Joi.date()
    .iso()
    .optional(),
  dateTo: Joi.date()
    .iso()
    .optional(),
  coinId: Joi.number()
    .integer()
    .positive()
    .optional(),
  strategyId: Joi.number()
    .integer()
    .positive()
    .optional()
})

// =============================================================================
// BACKTEST TRADE SCHEMAS
// =============================================================================

export const createBacktestTradeSchema = Joi.object({
  coinId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Coin ID must be a number',
      'number.integer': 'Coin ID must be an integer',
      'number.positive': 'Coin ID must be positive',
      'any.required': 'Coin ID is required'
    }),
  strategyId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Strategy ID must be a number',
      'number.integer': 'Strategy ID must be an integer',
      'number.positive': 'Strategy ID must be positive',
      'any.required': 'Strategy ID is required'
    }),
  tradeDate: Joi.date()
    .iso()
    .required()
    .messages({
      'date.base': 'Trade date must be a valid date',
      'date.format': 'Trade date must be in ISO format',
      'any.required': 'Trade date is required'
    }),
  tradeTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
    .required()
    .messages({
      'string.pattern.base': 'Trade time must be in HH:mm:ss format',
      'any.required': 'Trade time is required'
    }),
  entry: Joi.number()
    .positive()
    .required()
    .messages({
      'number.base': 'Entry must be a number',
      'number.positive': 'Entry must be positive',
      'any.required': 'Entry is required'
    }),
  stopLoss: Joi.number()
    .positive()
    .required()
    .messages({
      'number.base': 'Stop loss must be a number',
      'number.positive': 'Stop loss must be positive',
      'any.required': 'Stop loss is required'
    }),
  exit: Joi.number()
    .positive()
    .required()
    .messages({
      'number.base': 'Exit must be a number',
      'number.positive': 'Exit must be positive',
      'any.required': 'Exit is required'
    }),
  notes: Joi.string()
    .allow('')
    .optional()
})

export const updateBacktestTradeSchema = Joi.object({
  coinId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'Coin ID must be a number',
      'number.integer': 'Coin ID must be an integer',
      'number.positive': 'Coin ID must be positive'
    }),
  strategyId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'Strategy ID must be a number',
      'number.integer': 'Strategy ID must be an integer',
      'number.positive': 'Strategy ID must be positive'
    }),
  tradeDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'Trade date must be a valid date',
      'date.format': 'Trade date must be in ISO format'
    }),
  tradeTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
    .optional()
    .messages({
      'string.pattern.base': 'Trade time must be in HH:mm:ss format'
    }),
  entry: Joi.number()
    .positive()
    .optional()
    .messages({
      'number.base': 'Entry must be a number',
      'number.positive': 'Entry must be positive'
    }),
  stopLoss: Joi.number()
    .positive()
    .optional()
    .messages({
      'number.base': 'Stop loss must be a number',
      'number.positive': 'Stop loss must be positive'
    }),
  exit: Joi.number()
    .positive()
    .optional()
    .messages({
      'number.base': 'Exit must be a number',
      'number.positive': 'Exit must be positive'
    }),
  notes: Joi.string()
    .allow('')
    .optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
})

export const listBacktestTradesSchema = Joi.object({
  strategyId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'Strategy ID must be a number',
      'number.integer': 'Strategy ID must be an integer',
      'number.positive': 'Strategy ID must be positive'
    }),
  coinId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'Coin ID must be a number',
      'number.integer': 'Coin ID must be an integer',
      'number.positive': 'Coin ID must be positive'
    }),
  dateFrom: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'Date from must be a valid date',
      'date.format': 'Date from must be in ISO format'
    }),
  dateTo: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'Date to must be a valid date',
      'date.format': 'Date to must be in ISO format'
    }),
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must be at most 100'
    }),
  sortBy: Joi.string()
    .valid('tradeDate', 'rValue', 'createdAt')
    .default('tradeDate')
    .messages({
      'any.only': 'Sort by must be one of: tradeDate, rValue, createdAt'
    }),
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Sort order must be either asc or desc'
    })
})

// =============================================================================
// COMMON SCHEMAS
// =============================================================================

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
})
