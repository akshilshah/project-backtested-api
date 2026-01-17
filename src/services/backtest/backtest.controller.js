import { db } from '../../config/db'
import {
  createBacktestTradeSchema,
  listBacktestTradesSchema,
  updateBacktestTradeSchema
} from '../../utils/validation'
import { BACKTEST_MESSAGES } from './constants'

/**
 * Calculate direction and R value based on entry, stopLoss, and exit
 * Formula from Excel:
 * - Direction: IF(Entry > SL, "Long", IF(SL > Entry, "Short", ""))
 * - R Value for Long: (Exit - Entry) / (Entry - SL)
 * - R Value for Short: (Entry - Exit) / (SL - Entry)
 */
const calculateTradeMetrics = (entry, stopLoss, exit) => {
  // Determine direction
  const direction = entry > stopLoss ? 'Long' : entry < stopLoss ? 'Short' : ''

  if (!direction) {
    throw new Error('Invalid entry and stop loss values')
  }

  // Calculate R value
  let rValue = 0
  if (direction === 'Long') {
    const riskPerUnit = entry - stopLoss
    const rewardPerUnit = exit - entry
    rValue = riskPerUnit !== 0 ? rewardPerUnit / riskPerUnit : 0
  } else {
    // Short
    const riskPerUnit = stopLoss - entry
    const rewardPerUnit = entry - exit
    rValue = riskPerUnit !== 0 ? rewardPerUnit / riskPerUnit : 0
  }

  return {
    direction,
    rValue: parseFloat(rValue.toFixed(4))
  }
}

/**
 * Create a new backtest trade
 * POST /api/backtest
 */
export const createBacktestTrade = async (req, res) => {
  try {
    const context = req.context
    const body = await createBacktestTradeSchema.validateAsync(req.body)

    // Verify coin exists and belongs to organization
    const coin = await db.coin.findFirst({
      where: {
        id: body.coinId,
        organizationId: context.organization.id
      }
    })

    if (!coin) {
      return res.error({ message: BACKTEST_MESSAGES.COIN_NOT_FOUND })
    }

    // Verify strategy exists and belongs to organization
    const strategy = await db.strategy.findFirst({
      where: {
        id: body.strategyId,
        organizationId: context.organization.id
      }
    })

    if (!strategy) {
      return res.error({ message: BACKTEST_MESSAGES.STRATEGY_NOT_FOUND })
    }

    // Parse trade date and time
    const tradeDate = new Date(body.tradeDate)
    const [hours, minutes, seconds] = body.tradeTime.split(':').map(Number)
    const tradeTime = new Date(1970, 0, 1, hours, minutes, seconds || 0)

    // Calculate direction and R value
    const { direction, rValue } = calculateTradeMetrics(
      body.entry,
      body.stopLoss,
      body.exit
    )

    const backtestTrade = await db.backtestTrade.create({
      data: {
        tradeDate,
        tradeTime,
        entry: body.entry,
        stopLoss: body.stopLoss,
        exit: body.exit,
        direction,
        rValue,
        notes: body.notes || null,
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

    res.created(backtestTrade)
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}

/**
 * List backtest trades with filtering and pagination
 * GET /api/backtest
 */
export const listBacktestTrades = async (req, res) => {
  try {
    const context = req.context
    const query = await listBacktestTradesSchema.validateAsync(req.query)

    const {
      strategyId,
      coinId,
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

    if (strategyId) {
      where.strategyId = strategyId
    }

    if (coinId) {
      where.coinId = coinId
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

    // Build orderBy
    const orderBy = {}
    orderBy[sortBy] = sortOrder

    // Execute query
    const [backtestTrades, total] = await Promise.all([
      db.backtestTrade.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          coin: true,
          strategy: true
        }
      }),
      db.backtestTrade.count({ where })
    ])

    res.ok({
      backtestTrades,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}

/**
 * Get a single backtest trade by ID
 * GET /api/backtest/:id
 */
export const getBacktestTrade = async (req, res) => {
  try {
    const context = req.context
    const { id } = req.params

    const backtestTrade = await db.backtestTrade.findFirst({
      where: {
        id: parseInt(id),
        organizationId: context.organization.id
      },
      include: {
        coin: true,
        strategy: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    if (!backtestTrade) {
      return res.notFound({ message: BACKTEST_MESSAGES.TRADE_NOT_FOUND })
    }

    res.ok(backtestTrade)
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}

/**
 * Update a backtest trade
 * PUT /api/backtest/:id
 */
export const updateBacktestTrade = async (req, res) => {
  try {
    const context = req.context
    const { id } = req.params
    const body = await updateBacktestTradeSchema.validateAsync(req.body)

    // Check if trade exists
    const existingTrade = await db.backtestTrade.findFirst({
      where: {
        id: parseInt(id),
        organizationId: context.organization.id
      }
    })

    if (!existingTrade) {
      return res.notFound({ message: BACKTEST_MESSAGES.TRADE_NOT_FOUND })
    }

    // Verify coin if provided
    if (body.coinId) {
      const coin = await db.coin.findFirst({
        where: {
          id: body.coinId,
          organizationId: context.organization.id
        }
      })

      if (!coin) {
        return res.error({ message: BACKTEST_MESSAGES.COIN_NOT_FOUND })
      }
    }

    // Verify strategy if provided
    if (body.strategyId) {
      const strategy = await db.strategy.findFirst({
        where: {
          id: body.strategyId,
          organizationId: context.organization.id
        }
      })

      if (!strategy) {
        return res.error({ message: BACKTEST_MESSAGES.STRATEGY_NOT_FOUND })
      }
    }

    // Prepare update data
    const updateData = {
      updatedBy: { connect: { id: context.user.id } }
    }

    if (body.tradeDate) {
      updateData.tradeDate = new Date(body.tradeDate)
    }

    if (body.tradeTime) {
      const [hours, minutes, seconds] = body.tradeTime.split(':').map(Number)
      updateData.tradeTime = new Date(1970, 0, 1, hours, minutes, seconds || 0)
    }

    if (body.entry !== undefined) updateData.entry = body.entry
    if (body.stopLoss !== undefined) updateData.stopLoss = body.stopLoss
    if (body.exit !== undefined) updateData.exit = body.exit
    if (body.notes !== undefined) updateData.notes = body.notes || null
    if (body.coinId) updateData.coin = { connect: { id: body.coinId } }
    if (body.strategyId)
      updateData.strategy = { connect: { id: body.strategyId } }

    // Recalculate direction and R value if entry, stopLoss, or exit changed
    const entry = body.entry !== undefined ? body.entry : existingTrade.entry
    const stopLoss =
      body.stopLoss !== undefined ? body.stopLoss : existingTrade.stopLoss
    const exit = body.exit !== undefined ? body.exit : existingTrade.exit

    if (
      body.entry !== undefined ||
      body.stopLoss !== undefined ||
      body.exit !== undefined
    ) {
      const { direction, rValue } = calculateTradeMetrics(entry, stopLoss, exit)
      updateData.direction = direction
      updateData.rValue = rValue
    }

    const backtestTrade = await db.backtestTrade.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        coin: true,
        strategy: true
      }
    })

    res.ok(backtestTrade)
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}

/**
 * Delete a backtest trade
 * DELETE /api/backtest/:id
 */
export const deleteBacktestTrade = async (req, res) => {
  try {
    const context = req.context
    const { id } = req.params

    const backtestTrade = await db.backtestTrade.findFirst({
      where: {
        id: parseInt(id),
        organizationId: context.organization.id
      }
    })

    if (!backtestTrade) {
      return res.notFound({ message: BACKTEST_MESSAGES.TRADE_NOT_FOUND })
    }

    await db.backtestTrade.delete({
      where: { id: parseInt(id) }
    })

    res.ok({ message: BACKTEST_MESSAGES.TRADE_DELETED })
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}

/**
 * Get analytics/EV calculator for a strategy
 * GET /api/backtest/analytics/:strategyId
 *
 * Calculates Expected Value (EV) based on Excel formulas:
 * - Average Winning R = AVERAGE(all positive R values)
 * - Average Loss R = AVERAGE(absolute value of all negative R values)
 * - Win Percentage = COUNT(positive R) / COUNT(all R)
 * - Loss Percentage = COUNT(negative R) / COUNT(all R)
 * - EV = (Win% * Avg Winning R) - (Loss% * Avg Loss R)
 */
export const getStrategyAnalytics = async (req, res) => {
  try {
    const context = req.context
    const { strategyId } = req.params

    // Verify strategy exists and belongs to organization
    const strategy = await db.strategy.findFirst({
      where: {
        id: parseInt(strategyId),
        organizationId: context.organization.id
      }
    })

    if (!strategy) {
      return res.notFound({ message: BACKTEST_MESSAGES.STRATEGY_NOT_FOUND })
    }

    // Get all trades for this strategy
    const backtestTrades = await db.backtestTrade.findMany({
      where: {
        strategyId: parseInt(strategyId),
        organizationId: context.organization.id
      },
      select: {
        rValue: true
      }
    })

    if (backtestTrades.length === 0) {
      return res.ok({
        strategyId: parseInt(strategyId),
        totalTrades: 0,
        avgWinningR: 0,
        avgLossR: 0,
        winPercentage: 0,
        lossPercentage: 0,
        ev: 0
      })
    }

    // Separate wins and losses
    const wins = backtestTrades.filter(t => t.rValue > 0)
    const losses = backtestTrades.filter(t => t.rValue < 0)

    // Calculate Average Winning R
    const avgWinningR =
      wins.length > 0
        ? wins.reduce((sum, t) => sum + t.rValue, 0) / wins.length
        : 0

    // Calculate Average Loss R (absolute value)
    const avgLossR =
      losses.length > 0
        ? Math.abs(losses.reduce((sum, t) => sum + t.rValue, 0) / losses.length)
        : 0

    // Calculate Win/Loss Percentages
    const winPercentage = wins.length / backtestTrades.length
    const lossPercentage = losses.length / backtestTrades.length

    // Calculate EV: (Win% * Avg Winning R) - (Loss% * Avg Loss R)
    const ev = winPercentage * avgWinningR - lossPercentage * avgLossR

    res.ok({
      strategyId: parseInt(strategyId),
      totalTrades: backtestTrades.length,
      avgWinningR: parseFloat(avgWinningR.toFixed(4)),
      avgLossR: parseFloat(avgLossR.toFixed(4)),
      winPercentage: parseFloat(winPercentage.toFixed(4)),
      lossPercentage: parseFloat(lossPercentage.toFixed(4)),
      ev: parseFloat(ev.toFixed(4)),
      wins: wins.length,
      losses: losses.length
    })
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}
