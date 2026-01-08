import Joi from 'joi'

// Schema for creating a new trade
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
  quantity: Joi.number()
    .positive()
    .required()
    .messages({
      'number.base': 'Quantity must be a number',
      'number.positive': 'Quantity must be positive',
      'any.required': 'Quantity is required'
    }),
  notes: Joi.string()
    .allow('')
    .optional()
})

// Schema for updating an existing trade
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
  quantity: Joi.number()
    .positive()
    .optional()
    .messages({
      'number.base': 'Quantity must be a number',
      'number.positive': 'Quantity must be positive'
    }),
  notes: Joi.string()
    .allow('')
    .optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
})

// Schema for exiting a trade
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

// Schema for listing trades with filters
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

// Schema for analytics query params
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
