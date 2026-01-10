import { db } from '../../config/db'
import { TRADE_MESSAGES } from './constants'
import {
  createTradeSchema,
  updateTradeSchema,
  exitTradeSchema,
  listTradesSchema,
  analyticsSchema
} from '../../utils/validation'

/**
 * Create a new trade
 * POST /api/trades
 */
export const createTrade = async (req, res) => {
  try {
    const context = req.context
    const body = await createTradeSchema.validateAsync(req.body)

    // Verify coin exists and belongs to organization
    const coin = await db.coin.findFirst({
      where: {
        id: body.coinId,
        organizationId: context.organization.id
      }
    })

    if (!coin) {
      return res.error({ message: TRADE_MESSAGES.COIN_NOT_FOUND })
    }

    // Verify strategy exists and belongs to organization
    const strategy = await db.strategy.findFirst({
      where: {
        id: body.strategyId,
        organizationId: context.organization.id
      }
    })

    if (!strategy) {
      return res.error({ message: TRADE_MESSAGES.STRATEGY_NOT_FOUND })
    }

    // Parse trade date and time
    const tradeDate = new Date(body.tradeDate)
    const [hours, minutes, seconds] = body.tradeTime.split(':').map(Number)
    const tradeTime = new Date(1970, 0, 1, hours, minutes, seconds)

    const trade = await db.trade.create({
      data: {
        tradeDate,
        tradeTime,
        avgEntry: body.avgEntry,
        stopLoss: body.stopLoss,
        quantity: body.quantity,
        notes: body.notes || null,
        status: 'OPEN',
        coin: { connect: { id: body.coinId } },
        strategy: { connect: { id: body.strategyId } },
        organization: { connect: { id: context.organization.id } },
        createdBy: { connect: { id: context.user.id } },
        updatedBy: { connect: { id: context.user.id } }
      },
      include: {
        coin: true,
        strategy: true
      }
    })

    res.created(trade)
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}

/**
 * List trades with filtering and pagination
 * GET /api/trades
 */
export const listTrades = async (req, res) => {
  try {
    const context = req.context
    const query = await listTradesSchema.validateAsync(req.query)

    const {
      status,
      coinId,
      strategyId,
      dateFrom,
      dateTo,
      page,
      limit,
      sortBy,
      sortOrder
    } = query

    // Build where clause
    const where = {
      organizationId: context.organization.id
    }

    if (status) {
      where.status = status
    }

    if (coinId) {
      where.coinId = coinId
    }

    if (strategyId) {
      where.strategyId = strategyId
    }

    if (dateFrom || dateTo) {
      where.tradeDate = {}
      if (dateFrom) {
        where.tradeDate.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.tradeDate.lte = new Date(dateTo)
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit
    const take = limit

    // Build order by
    const orderBy = { [sortBy]: sortOrder }

    // Execute queries in parallel
    const [trades, total] = await Promise.all([
      db.trade.findMany({
        where,
        include: {
          coin: {
            select: { id: true, name: true, symbol: true }
          },
          strategy: {
            select: { id: true, name: true }
          }
        },
        orderBy,
        skip,
        take
      }),
      db.trade.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    res.ok({
      trades,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}

/**
 * Get single trade details
 * GET /api/trades/:id
 */
export const getTrade = async (req, res) => {
  try {
    const context = req.context
    const tradeId = parseInt(req.params.id, 10)

    if (isNaN(tradeId)) {
      return res.error({ message: 'Invalid trade ID' })
    }

    const trade = await db.trade.findFirst({
      where: {
        id: tradeId,
        organizationId: context.organization.id
      },
      include: {
        coin: true,
        strategy: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        updatedBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    })

    if (!trade) {
      return res.error({ message: TRADE_MESSAGES.TRADE_NOT_FOUND })
    }

    res.ok(trade)
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}

/**
 * Update an existing trade (only OPEN trades)
 * PUT /api/trades/:id
 */
export const updateTrade = async (req, res) => {
  try {
    const context = req.context
    const tradeId = parseInt(req.params.id, 10)

    if (isNaN(tradeId)) {
      return res.error({ message: 'Invalid trade ID' })
    }

    const body = await updateTradeSchema.validateAsync(req.body)

    // Find existing trade
    const existingTrade = await db.trade.findFirst({
      where: {
        id: tradeId,
        organizationId: context.organization.id
      }
    })

    if (!existingTrade) {
      return res.error({ message: TRADE_MESSAGES.TRADE_NOT_FOUND })
    }

    // Cannot update closed trades
    if (existingTrade.status === 'CLOSED') {
      return res.error({ message: TRADE_MESSAGES.TRADE_CANNOT_UPDATE_CLOSED })
    }

    // Verify coin if being updated
    if (body.coinId) {
      const coin = await db.coin.findFirst({
        where: {
          id: body.coinId,
          organizationId: context.organization.id
        }
      })

      if (!coin) {
        return res.error({ message: TRADE_MESSAGES.COIN_NOT_FOUND })
      }
    }

    // Verify strategy if being updated
    if (body.strategyId) {
      const strategy = await db.strategy.findFirst({
        where: {
          id: body.strategyId,
          organizationId: context.organization.id
        }
      })

      if (!strategy) {
        return res.error({ message: TRADE_MESSAGES.STRATEGY_NOT_FOUND })
      }
    }

    // Build update data
    const updateData = {
      updatedBy: { connect: { id: context.user.id } }
    }

    if (body.coinId) updateData.coin = { connect: { id: body.coinId } }
    if (body.strategyId) updateData.strategy = { connect: { id: body.strategyId } }
    if (body.avgEntry !== undefined) updateData.avgEntry = body.avgEntry
    if (body.stopLoss !== undefined) updateData.stopLoss = body.stopLoss
    if (body.quantity !== undefined) updateData.quantity = body.quantity
    if (body.notes !== undefined) updateData.notes = body.notes || null

    if (body.tradeDate) {
      updateData.tradeDate = new Date(body.tradeDate)
    }

    if (body.tradeTime) {
      const [hours, minutes, seconds] = body.tradeTime.split(':').map(Number)
      updateData.tradeTime = new Date(1970, 0, 1, hours, minutes, seconds)
    }

    const trade = await db.trade.update({
      where: { id: tradeId },
      data: updateData,
      include: {
        coin: true,
        strategy: true
      }
    })

    res.ok(trade)
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}

/**
 * Exit/close a trade
 * POST /api/trades/:id/exit
 */
export const exitTrade = async (req, res) => {
  try {
    const context = req.context
    const tradeId = parseInt(req.params.id, 10)

    if (isNaN(tradeId)) {
      return res.error({ message: 'Invalid trade ID' })
    }

    const body = await exitTradeSchema.validateAsync(req.body)

    // Find existing trade
    const existingTrade = await db.trade.findFirst({
      where: {
        id: tradeId,
        organizationId: context.organization.id
      }
    })

    if (!existingTrade) {
      return res.error({ message: TRADE_MESSAGES.TRADE_NOT_FOUND })
    }

    // Cannot exit already closed trades
    if (existingTrade.status === 'CLOSED') {
      return res.error({ message: TRADE_MESSAGES.TRADE_ALREADY_CLOSED })
    }

    // Parse exit date and time
    const exitDate = new Date(body.exitDate)
    const [hours, minutes, seconds] = body.exitTime.split(':').map(Number)
    const exitTime = new Date(1970, 0, 1, hours, minutes, seconds)

    // Validate exit date is not before trade date
    if (exitDate < existingTrade.tradeDate) {
      return res.error({ message: TRADE_MESSAGES.INVALID_EXIT_DATE })
    }

    // Calculate P&L
    const profitLoss = (body.avgExit - existingTrade.avgEntry) * existingTrade.quantity

    // Calculate P&L percentage
    const profitLossPercentage = ((body.avgExit - existingTrade.avgEntry) / existingTrade.avgEntry) * 100

    // Calculate duration in days
    const tradeDateMs = existingTrade.tradeDate.getTime()
    const exitDateMs = exitDate.getTime()
    const duration = Math.ceil((exitDateMs - tradeDateMs) / (1000 * 60 * 60 * 24))

    // Update trade with exit details
    const trade = await db.trade.update({
      where: { id: tradeId },
      data: {
        avgExit: body.avgExit,
        exitDate,
        exitTime,
        status: 'CLOSED',
        profitLoss,
        profitLossPercentage,
        duration,
        notes: body.notes !== undefined ? (body.notes || null) : existingTrade.notes,
        updatedBy: { connect: { id: context.user.id } }
      },
      include: {
        coin: true,
        strategy: true
      }
    })

    res.ok(trade)
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}

/**
 * Delete a trade
 * DELETE /api/trades/:id
 */
export const deleteTrade = async (req, res) => {
  try {
    const context = req.context
    const tradeId = parseInt(req.params.id, 10)

    if (isNaN(tradeId)) {
      return res.error({ message: 'Invalid trade ID' })
    }

    // Find existing trade
    const existingTrade = await db.trade.findFirst({
      where: {
        id: tradeId,
        organizationId: context.organization.id
      }
    })

    if (!existingTrade) {
      return res.error({ message: TRADE_MESSAGES.TRADE_NOT_FOUND })
    }

    await db.trade.delete({
      where: { id: tradeId }
    })

    res.ok({ message: TRADE_MESSAGES.TRADE_DELETED })
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}

/**
 * Get trade analytics
 * GET /api/trades/analytics
 */
export const getAnalytics = async (req, res) => {
  try {
    const context = req.context
    const query = await analyticsSchema.validateAsync(req.query)

    const { dateFrom, dateTo, coinId, strategyId } = query

    // Build base where clause
    const baseWhere = {
      organizationId: context.organization.id
    }

    if (coinId) baseWhere.coinId = coinId
    if (strategyId) baseWhere.strategyId = strategyId

    if (dateFrom || dateTo) {
      baseWhere.tradeDate = {}
      if (dateFrom) baseWhere.tradeDate.gte = new Date(dateFrom)
      if (dateTo) baseWhere.tradeDate.lte = new Date(dateTo)
    }

    // Where clause for closed trades only
    const closedWhere = { ...baseWhere, status: 'CLOSED' }

    // Execute all queries in parallel
    const [
      totalTrades,
      openTrades,
      closedTrades,
      aggregates,
      bestTrade,
      worstTrade,
      tradesByCoin,
      tradesByStrategy
    ] = await Promise.all([
      // Total trades count
      db.trade.count({ where: baseWhere }),

      // Open trades count
      db.trade.count({ where: { ...baseWhere, status: 'OPEN' } }),

      // Closed trades count
      db.trade.count({ where: closedWhere }),

      // Aggregate P&L data for closed trades
      db.trade.aggregate({
        where: closedWhere,
        _sum: { profitLoss: true },
        _avg: { profitLoss: true, profitLossPercentage: true }
      }),

      // Best trade (highest P&L)
      db.trade.findFirst({
        where: closedWhere,
        orderBy: { profitLoss: 'desc' },
        include: {
          coin: { select: { id: true, name: true, symbol: true } },
          strategy: { select: { id: true, name: true } }
        }
      }),

      // Worst trade (lowest P&L)
      db.trade.findFirst({
        where: closedWhere,
        orderBy: { profitLoss: 'asc' },
        include: {
          coin: { select: { id: true, name: true, symbol: true } },
          strategy: { select: { id: true, name: true } }
        }
      }),

      // P&L by coin
      db.trade.groupBy({
        by: ['coinId'],
        where: closedWhere,
        _sum: { profitLoss: true },
        _count: { id: true },
        _avg: { profitLossPercentage: true }
      }),

      // P&L by strategy
      db.trade.groupBy({
        by: ['strategyId'],
        where: closedWhere,
        _sum: { profitLoss: true },
        _count: { id: true },
        _avg: { profitLossPercentage: true }
      })
    ])

    // Calculate win rate (profitable trades / total closed trades)
    const profitableTrades = await db.trade.count({
      where: {
        ...closedWhere,
        profitLoss: { gt: 0 }
      }
    })

    const winRate = closedTrades > 0 ? (profitableTrades / closedTrades) * 100 : 0

    // Fetch coin and strategy names for the grouped data
    const coinIds = tradesByCoin.map(t => t.coinId)
    const strategyIds = tradesByStrategy.map(t => t.strategyId)

    const [coins, strategies] = await Promise.all([
      db.coin.findMany({
        where: { id: { in: coinIds } },
        select: { id: true, name: true, symbol: true }
      }),
      db.strategy.findMany({
        where: { id: { in: strategyIds } },
        select: { id: true, name: true }
      })
    ])

    // Map coin and strategy data
    const coinMap = new Map(coins.map(c => [c.id, c]))
    const strategyMap = new Map(strategies.map(s => [s.id, s]))

    const byCoin = tradesByCoin.map(item => ({
      coin: coinMap.get(item.coinId),
      totalTrades: item._count.id,
      totalProfitLoss: item._sum.profitLoss || 0,
      avgProfitLossPercentage: item._avg.profitLossPercentage || 0
    }))

    const byStrategy = tradesByStrategy.map(item => ({
      strategy: strategyMap.get(item.strategyId),
      totalTrades: item._count.id,
      totalProfitLoss: item._sum.profitLoss || 0,
      avgProfitLossPercentage: item._avg.profitLossPercentage || 0
    }))

    res.ok({
      summary: {
        totalTrades,
        openTrades,
        closedTrades,
        profitableTrades,
        losingTrades: closedTrades - profitableTrades,
        winRate: parseFloat(winRate.toFixed(2)),
        totalProfitLoss: aggregates._sum.profitLoss || 0,
        avgProfitLoss: aggregates._avg.profitLoss || 0,
        avgProfitLossPercentage: aggregates._avg.profitLossPercentage || 0
      },
      bestTrade,
      worstTrade,
      byCoin,
      byStrategy
    })
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}
