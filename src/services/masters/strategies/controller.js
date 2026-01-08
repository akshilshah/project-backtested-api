import { db } from '../../../config/db'
import { constants } from '../../../utils/constants'
import {
  createStrategySchema,
  updateStrategySchema,
  idParamSchema
} from './validation'

export const createStrategy = async (req, res) => {
  try {
    const context = req.context
    const body = await createStrategySchema.validateAsync(req.body)

    // Check if strategy with same name already exists in this organization
    const existingStrategy = await db.strategy.findFirst({
      where: {
        name: body.name,
        organizationId: context.organization.id
      }
    })

    if (existingStrategy) {
      return res.conflict(constants.STRATEGY_NAME_EXISTS)
    }

    const strategy = await db.strategy.create({
      data: {
        name: body.name,
        description: body.description,
        rules: body.rules,
        organization: { connect: { id: context.organization.id } },
        createdBy: { connect: { id: context.user.id } },
        updatedBy: { connect: { id: context.user.id } }
      }
    })

    res.created({ message: constants.STRATEGY_CREATED, strategy })
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}

export const listStrategies = async (req, res) => {
  try {
    const context = req.context

    const strategies = await db.strategy.findMany({
      where: {
        organizationId: context.organization.id
      },
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        description: true,
        rules: true,
        createdAt: true,
        updatedAt: true
      }
    })

    res.ok({ strategies })
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}

export const getStrategy = async (req, res) => {
  try {
    const context = req.context
    const { id } = await idParamSchema.validateAsync(req.params)

    const strategy = await db.strategy.findFirst({
      where: {
        id,
        organizationId: context.organization.id
      },
      select: {
        id: true,
        name: true,
        description: true,
        rules: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    if (!strategy) {
      return res.notFound(constants.STRATEGY_NOT_FOUND)
    }

    res.ok({ strategy })
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}

export const updateStrategy = async (req, res) => {
  try {
    const context = req.context
    const { id } = await idParamSchema.validateAsync(req.params)
    const body = await updateStrategySchema.validateAsync(req.body)

    // Check if strategy exists
    const existingStrategy = await db.strategy.findFirst({
      where: {
        id,
        organizationId: context.organization.id
      }
    })

    if (!existingStrategy) {
      return res.notFound(constants.STRATEGY_NOT_FOUND)
    }

    // If updating name, check for uniqueness
    if (body.name && body.name !== existingStrategy.name) {
      const nameExists = await db.strategy.findFirst({
        where: {
          name: body.name,
          organizationId: context.organization.id,
          id: { not: id }
        }
      })

      if (nameExists) {
        return res.conflict(constants.STRATEGY_NAME_EXISTS)
      }
    }

    const strategy = await db.strategy.update({
      where: { id },
      data: {
        ...body,
        updatedBy: { connect: { id: context.user.id } }
      }
    })

    res.ok({ message: constants.STRATEGY_UPDATED, strategy })
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}

export const deleteStrategy = async (req, res) => {
  try {
    const context = req.context
    const { id } = await idParamSchema.validateAsync(req.params)

    // Check if strategy exists
    const existingStrategy = await db.strategy.findFirst({
      where: {
        id,
        organizationId: context.organization.id
      }
    })

    if (!existingStrategy) {
      return res.notFound(constants.STRATEGY_NOT_FOUND)
    }

    // Check if strategy is used in any trades
    const tradesCount = await db.trade.count({
      where: {
        strategyId: id,
        organizationId: context.organization.id
      }
    })

    if (tradesCount > 0) {
      return res.error({
        message: `Cannot delete strategy. It is used in ${tradesCount} trade(s).`
      })
    }

    await db.strategy.delete({
      where: { id }
    })

    res.ok({ message: constants.STRATEGY_DELETED })
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}
