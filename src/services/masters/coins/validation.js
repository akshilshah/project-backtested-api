import Joi from 'joi'

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

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
})
