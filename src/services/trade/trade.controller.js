import { db } from '../../config/db'
import {
  analyticsSchema,
  createTradeSchema,
  exitTradeSchema,
  listTradesSchema,
  updateTradeSchema
} from '../../utils/validation'
import { TRADE_MESSAGES } from './constants'

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
        stopLossPercentage: body.stopLossPercentage,
        quantity: body.quantity,
        amount: body.amount,
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
 * Calculate derived trade fields based on Excel formulas
 */
const calculateDerivedFields = trade => {
  const { avgEntry, stopLoss, stopLossPercentage, amount, avgExit } = trade

  // Direction: Short if entry < stopLoss, else Long
  // Excel: =IF(H2>I2,"Long",IF(I2>H2,"Short",""))
  const direction = avgEntry < stopLoss ? 'Short' : 'Long'

  // Expected Loss: Amount * stopLossPercentage / 100
  // Excel: =K2*1.8% (using stopLossPercentage field)
  const expectedLoss = amount * (stopLossPercentage / 100)

  // Calculate risk per unit based on direction
  // Excel: IF(F2="Short", (H2-I2), IF(F2="Long", (I2-H2), "0"))*-1
  let riskPerUnit
  if (direction === 'Short') {
    riskPerUnit = -(avgEntry - stopLoss) // = (stopLoss - avgEntry)
  } else {
    // Long
    riskPerUnit = -(stopLoss - avgEntry) // = (avgEntry - stopLoss)
  }

  // Trade Value: Risk-based position sizing
  // Excel: =((J2/(IF(F2="Short", (H2-I2), IF(F2="Long", (I2-H2), "0"))*-1))*H2)
  // This calculates position size that would result in expectedLoss if stop is hit
  const tradeValue =
    riskPerUnit !== 0 ? (expectedLoss / riskPerUnit) * avgEntry : 0

  // Position Size: Trade Value / Average Entry
  // Excel: =M2/H2
  const positionSize = avgEntry !== 0 ? tradeValue / avgEntry : 0

  // Leverage: Trade Value / Amount
  // Excel: =M2/K2
  const leverage = amount !== 0 ? tradeValue / amount : 0

  // Commission (only if trade is closed)
  // Excel: =IF(G2="Limit", 0.0002*M2, 0.0005*M2) + 0.0005*O2*L2 + M2*R2
  // Note: Assuming Limit orders (0.02% entry) since entryOrder field doesn't exist
  // Funding rate (R2) is set to 0 since it doesn't exist in the model
  let commission = null
  let realisedProfitLoss = null

  if (avgExit !== null) {
    // Entry commission: 0.02% for Limit orders (0.0002)
    const entryCommission = 0.0002 * tradeValue

    // Exit commission: 0.05% on (avgExit * positionSize)
    const exitCommission = 0.0005 * avgExit * positionSize

    // Funding: tradeValue * fundingRate (set to 0 for now)
    const funding = 0

    commission = entryCommission + exitCommission + funding

    // Realised Profit/Loss (Net P/L after commission)
    // Excel: =(IF(F2="Short", (H2-O2)*L2, IF(F2="Long", (O2-H2)*L2, "0")) - Q2
    let grossProfitLoss
    if (direction === 'Short') {
      grossProfitLoss = (avgEntry - avgExit) * positionSize
    } else {
      // Long
      grossProfitLoss = (avgExit - avgEntry) * positionSize
    }

    // Net P/L = Gross P/L - Commission
    realisedProfitLoss = grossProfitLoss - commission
  }

  return {
    direction,
    expectedLoss,
    tradeValue,
    positionSize,
    leverage,
    commission,
    realisedProfitLoss
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

    // Add derived fields
    const derived = calculateDerivedFields(trade)

    res.ok({
      ...trade,
      derived
    })
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
    if (body.strategyId)
      updateData.strategy = { connect: { id: body.strategyId } }
    if (body.avgEntry !== undefined) updateData.avgEntry = body.avgEntry
    if (body.stopLoss !== undefined) updateData.stopLoss = body.stopLoss
    if (body.stopLossPercentage !== undefined)
      updateData.stopLossPercentage = body.stopLossPercentage
    if (body.quantity !== undefined) updateData.quantity = body.quantity
    if (body.amount !== undefined) updateData.amount = body.amount
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

    // Determine trade direction
    const direction =
      existingTrade.avgEntry < existingTrade.stopLoss ? 'Short' : 'Long'

    // Calculate risk-based position size (matching Excel formula)
    const expectedLoss =
      existingTrade.amount * (existingTrade.stopLossPercentage / 100)
    let riskPerUnit
    if (direction === 'Short') {
      riskPerUnit = -(existingTrade.avgEntry - existingTrade.stopLoss)
    } else {
      riskPerUnit = -(existingTrade.stopLoss - existingTrade.avgEntry)
    }
    const tradeValue =
      riskPerUnit !== 0
        ? (expectedLoss / riskPerUnit) * existingTrade.avgEntry
        : 0
    const positionSize =
      existingTrade.avgEntry !== 0 ? tradeValue / existingTrade.avgEntry : 0

    // Calculate commission
    const entryCommission = 0.0002 * tradeValue
    const exitCommission = 0.0005 * body.avgExit * positionSize
    const commission = entryCommission + exitCommission

    // Calculate P&L based on direction
    let grossProfitLoss
    if (direction === 'Short') {
      // Short: profit when entry > exit
      grossProfitLoss = (existingTrade.avgEntry - body.avgExit) * positionSize
    } else {
      // Long: profit when exit > entry
      grossProfitLoss = (body.avgExit - existingTrade.avgEntry) * positionSize
    }

    // Net P&L after commission
    const profitLoss = grossProfitLoss - commission

    // Calculate P&L percentage (based on the account amount risked)
    const profitLossPercentage = (profitLoss / existingTrade.amount) * 100

    // Calculate duration in days
    const tradeDateMs = existingTrade.tradeDate.getTime()
    const exitDateMs = exitDate.getTime()
    const duration = Math.ceil(
      (exitDateMs - tradeDateMs) / (1000 * 60 * 60 * 24)
    )

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
        notes:
          body.notes !== undefined ? body.notes || null : existingTrade.notes,
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

    const winRate =
      closedTrades > 0 ? (profitableTrades / closedTrades) * 100 : 0

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
