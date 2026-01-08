import { db } from '../../../config/db'
import { constants } from '../../../utils/constants'
import { createCoinSchema, updateCoinSchema, idParamSchema } from '../../../utils/validation'

export const createCoin = async (req, res) => {
  try {
    const context = req.context
    const body = await createCoinSchema.validateAsync(req.body)

    // Check if coin with same symbol already exists in this organization
    const existingCoin = await db.coin.findFirst({
      where: {
        symbol: body.symbol,
        organizationId: context.organization.id
      }
    })

    if (existingCoin) {
      return res.conflict(constants.COIN_SYMBOL_EXISTS)
    }

    const coin = await db.coin.create({
      data: {
        name: body.name,
        symbol: body.symbol,
        description: body.description,
        organization: { connect: { id: context.organization.id } },
        createdBy: { connect: { id: context.user.id } },
        updatedBy: { connect: { id: context.user.id } }
      }
    })

    res.created({ message: constants.COIN_CREATED, coin })
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}

export const listCoins = async (req, res) => {
  try {
    const context = req.context

    const coins = await db.coin.findMany({
      where: {
        organizationId: context.organization.id
      },
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        symbol: true,
        description: true,
        createdAt: true,
        updatedAt: true
      }
    })

    res.ok({ coins })
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}

export const getCoin = async (req, res) => {
  try {
    const context = req.context
    const { id } = await idParamSchema.validateAsync(req.params)

    const coin = await db.coin.findFirst({
      where: {
        id,
        organizationId: context.organization.id
      },
      select: {
        id: true,
        name: true,
        symbol: true,
        description: true,
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

    if (!coin) {
      return res.notFound(constants.COIN_NOT_FOUND)
    }

    res.ok({ coin })
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}

export const updateCoin = async (req, res) => {
  try {
    const context = req.context
    const { id } = await idParamSchema.validateAsync(req.params)
    const body = await updateCoinSchema.validateAsync(req.body)

    // Check if coin exists
    const existingCoin = await db.coin.findFirst({
      where: {
        id,
        organizationId: context.organization.id
      }
    })

    if (!existingCoin) {
      return res.notFound(constants.COIN_NOT_FOUND)
    }

    // If updating symbol, check for uniqueness
    if (body.symbol && body.symbol !== existingCoin.symbol) {
      const symbolExists = await db.coin.findFirst({
        where: {
          symbol: body.symbol,
          organizationId: context.organization.id,
          id: { not: id }
        }
      })

      if (symbolExists) {
        return res.conflict(constants.COIN_SYMBOL_EXISTS)
      }
    }

    const coin = await db.coin.update({
      where: { id },
      data: {
        ...body,
        updatedBy: { connect: { id: context.user.id } }
      }
    })

    res.ok({ message: constants.COIN_UPDATED, coin })
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}

export const deleteCoin = async (req, res) => {
  try {
    const context = req.context
    const { id } = await idParamSchema.validateAsync(req.params)

    // Check if coin exists
    const existingCoin = await db.coin.findFirst({
      where: {
        id,
        organizationId: context.organization.id
      }
    })

    if (!existingCoin) {
      return res.notFound(constants.COIN_NOT_FOUND)
    }

    // Check if coin is used in any trades
    const tradesCount = await db.trade.count({
      where: {
        coinId: id,
        organizationId: context.organization.id
      }
    })

    if (tradesCount > 0) {
      return res.error({
        message: `Cannot delete coin. It is used in ${tradesCount} trade(s).`
      })
    }

    await db.coin.delete({
      where: { id }
    })

    res.ok({ message: constants.COIN_DELETED })
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}
