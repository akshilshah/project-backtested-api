import Joi from 'joi'

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

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
})
