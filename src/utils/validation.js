import { v4 as uuidv4 } from 'uuid'
const Joi = require('joi')

export const authSchema = Joi.object({
  email: Joi.string()
    .email()
    .required(),
  password: Joi.string().required()
})

export const leadSchema = Joi.object({
  email: Joi.string()
    .email()
    .required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  mobile: Joi.string().required(),
  title: Joi.string().required(),
  blueId: Joi.string().allow('', null),
  url: Joi.string().allow('', null),
  sessionId: Joi.string()
})

export const dashboardSchema = Joi.object({
  startDate: Joi.date().iso(),
  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
})

export const feedbackSchema = Joi.object({
  vote: Joi.string(),
  messageId: Joi.string().required(),
  reasonFactsIncorrect: Joi.boolean(),
  reasonFormatOfAnswer: Joi.boolean(),
  reasonVideo: Joi.boolean(),
  reasonReviews: Joi.boolean(),
  reasonOther: Joi.string().allow('', null)
})

export const chatSchema = Joi.object({
  query: Joi.string().required(),
  prompts: Joi.boolean(),
  productId: Joi.string(),
  blueId: Joi.string(),
  phId: Joi.string(),
  sessionId: Joi.string()
    .optional()
    .allow(null, '')
    .default(() => {
      return uuidv4()
    })
})
