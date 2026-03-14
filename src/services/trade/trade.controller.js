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
        entryOrderType: body.entryOrderType || 'LIMIT',
        entryFeePercentage:
          body.entryFeePercentage ||
          (body.entryOrderType === 'MARKET' ? 0.05 : 0.02),
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
            select: { id: true, name: true, symbol: true, image: true }
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
  const {
    avgEntry,
    stopLoss,
    stopLossPercentage,
    amount,
    avgExit,
    entryFeePercentage,
    exitFeePercentage
  } = trade

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
  // Uses dynamic fee percentages from trade data
  let commission = null
  let realisedProfitLoss = null

  if (avgExit !== null) {
    // Entry commission: use stored fee percentage (converted to decimal)
    const entryCommission = (entryFeePercentage / 100) * tradeValue

    // Exit commission: use stored fee percentage (default 0.05 if not set)
    const exitFee =
      exitFeePercentage !== null && exitFeePercentage !== undefined
        ? exitFeePercentage
        : 0.05
    const exitCommission = (exitFee / 100) * avgExit * positionSize

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

    // Cannot update closed trades (except notes and realisedPnl)
    if (existingTrade.status === 'CLOSED') {
      const allowedClosedFields = ['notes', 'realisedPnl']
      const updateKeys = Object.keys(body).filter(
        key => body[key] !== undefined
      )
      const isAllowedUpdate = updateKeys.every(key =>
        allowedClosedFields.includes(key)
      )

      if (!isAllowedUpdate) {
        return res.error({ message: TRADE_MESSAGES.TRADE_CANNOT_UPDATE_CLOSED })
      }
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
    if (body.realisedPnl !== undefined) updateData.realisedPnl = body.realisedPnl

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
 * Preview exit trade P&L calculation without closing the trade
 * POST /api/trades/:id/preview-exit
 */
export const previewExitTrade = async (req, res) => {
  try {
    const context = req.context
    const tradeId = parseInt(req.params.id, 10)

    if (isNaN(tradeId)) {
      return res.error({ message: 'Invalid trade ID' })
    }

    const { avgExit, exitFeePercentage } = req.body

    if (!avgExit || isNaN(Number(avgExit)) || Number(avgExit) <= 0) {
      return res.error({ message: 'Valid exit price is required' })
    }

    const exitFee =
      exitFeePercentage !== undefined ? Number(exitFeePercentage) : 0.05

    // Find existing trade
    const trade = await db.trade.findFirst({
      where: {
        id: tradeId,
        organizationId: context.organization.id
      }
    })

    if (!trade) {
      return res.error({ message: TRADE_MESSAGES.TRADE_NOT_FOUND })
    }

    // Cannot preview for already closed trades
    if (trade.status === 'CLOSED') {
      return res.error({ message: TRADE_MESSAGES.TRADE_ALREADY_CLOSED })
    }

    // Determine trade direction
    const direction = trade.avgEntry < trade.stopLoss ? 'Short' : 'Long'

    // Calculate risk-based position size (matching Excel formula)
    const expectedLoss = trade.amount * (trade.stopLossPercentage / 100)
    let riskPerUnit
    if (direction === 'Short') {
      riskPerUnit = -(trade.avgEntry - trade.stopLoss)
    } else {
      riskPerUnit = -(trade.stopLoss - trade.avgEntry)
    }
    const tradeValue =
      riskPerUnit !== 0 ? (expectedLoss / riskPerUnit) * trade.avgEntry : 0
    const positionSize = trade.avgEntry !== 0 ? tradeValue / trade.avgEntry : 0

    // Calculate commission using dynamic fee percentages
    const entryCommission = (trade.entryFeePercentage / 100) * tradeValue
    const exitCommission = (exitFee / 100) * Number(avgExit) * positionSize
    const commission = entryCommission + exitCommission

    // Calculate P&L based on direction
    let grossProfitLoss
    if (direction === 'Short') {
      // Short: profit when entry > exit
      grossProfitLoss = (trade.avgEntry - Number(avgExit)) * positionSize
    } else {
      // Long: profit when exit > entry
      grossProfitLoss = (Number(avgExit) - trade.avgEntry) * positionSize
    }

    // Net P&L after commission
    const profitLoss = grossProfitLoss - commission

    // Calculate P&L percentage (based on the account amount risked)
    const profitLossPercentage = (profitLoss / trade.amount) * 100

    res.ok({
      profitLoss,
      profitLossPercentage,
      direction,
      commission,
      grossProfitLoss
    })
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

    // Calculate commission using dynamic fee percentages
    const exitFeePercentage = body.exitFeePercentage || 0.05
    const entryCommission =
      (existingTrade.entryFeePercentage / 100) * tradeValue
    const exitCommission =
      (exitFeePercentage / 100) * body.avgExit * positionSize
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

    // Calculate duration in hours (including time component)
    // Combine date and time for accurate calculation
    const entryDateTime = new Date(
      existingTrade.tradeDate.getFullYear(),
      existingTrade.tradeDate.getMonth(),
      existingTrade.tradeDate.getDate(),
      existingTrade.tradeTime.getUTCHours(),
      existingTrade.tradeTime.getUTCMinutes(),
      existingTrade.tradeTime.getUTCSeconds()
    )

    const exitDateTime = new Date(
      exitDate.getFullYear(),
      exitDate.getMonth(),
      exitDate.getDate(),
      exitTime.getUTCHours(),
      exitTime.getUTCMinutes(),
      exitTime.getUTCSeconds()
    )

    // Duration in hours (rounded to 1 decimal place)
    const durationMs = exitDateTime.getTime() - entryDateTime.getTime()
    const duration = Math.round((durationMs / (1000 * 60 * 60)) * 10) / 10

    // Update trade with exit details
    const trade = await db.trade.update({
      where: { id: tradeId },
      data: {
        avgExit: body.avgExit,
        exitDate,
        exitTime,
        exitFeePercentage,
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
 * Update exit details of a closed trade
 * PUT /api/trades/:id/exit
 */
export const updateExitTrade = async (req, res) => {
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

    // Can only update exit for closed trades
    if (existingTrade.status !== 'CLOSED') {
      return res.error({
        message: 'Can only update exit details for closed trades'
      })
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

    // Calculate commission using dynamic fee percentages
    const exitFeePercentage = body.exitFeePercentage || 0.05
    const entryCommission =
      (existingTrade.entryFeePercentage / 100) * tradeValue
    const exitCommission =
      (exitFeePercentage / 100) * body.avgExit * positionSize
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

    // Calculate duration in hours (including time component)
    // Combine date and time for accurate calculation
    const entryDateTime = new Date(
      existingTrade.tradeDate.getFullYear(),
      existingTrade.tradeDate.getMonth(),
      existingTrade.tradeDate.getDate(),
      existingTrade.tradeTime.getUTCHours(),
      existingTrade.tradeTime.getUTCMinutes(),
      existingTrade.tradeTime.getUTCSeconds()
    )

    const exitDateTime = new Date(
      exitDate.getFullYear(),
      exitDate.getMonth(),
      exitDate.getDate(),
      exitTime.getUTCHours(),
      exitTime.getUTCMinutes(),
      exitTime.getUTCSeconds()
    )

    // Duration in hours (rounded to 1 decimal place)
    const durationMs = exitDateTime.getTime() - entryDateTime.getTime()
    const duration = Math.round((durationMs / (1000 * 60 * 60)) * 10) / 10

    // Update trade with new exit details
    const trade = await db.trade.update({
      where: { id: tradeId },
      data: {
        avgExit: body.avgExit,
        exitDate,
        exitTime,
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
        _avg: { profitLoss: true }
      }),

      // Best trade (highest P&L)
      db.trade.findFirst({
        where: closedWhere,
        orderBy: { profitLoss: 'desc' },
        select: { profitLoss: true }
      }),

      // Worst trade (lowest P&L)
      db.trade.findFirst({
        where: closedWhere,
        orderBy: { profitLoss: 'asc' },
        select: { profitLoss: true }
      }),

      // P&L by coin
      db.trade.groupBy({
        by: ['coinId'],
        where: closedWhere,
        _sum: { profitLoss: true },
        _count: { id: true }
      }),

      // P&L by strategy
      db.trade.groupBy({
        by: ['strategyId'],
        where: closedWhere,
        _sum: { profitLoss: true },
        _count: { id: true }
      })
    ])

    // Calculate overall win rate
    const profitableTrades = await db.trade.count({
      where: {
        ...closedWhere,
        profitLoss: { gt: 0 }
      }
    })

    const winRate =
      closedTrades > 0
        ? parseFloat(((profitableTrades / closedTrades) * 100).toFixed(2))
        : 0

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

    // Calculate win rate per coin
    const winRateByCoin = await Promise.all(
      coinIds.map(async coinId => {
        const profitableCount = await db.trade.count({
          where: {
            ...closedWhere,
            coinId,
            profitLoss: { gt: 0 }
          }
        })
        const totalCount =
          tradesByCoin.find(t => t.coinId === coinId)?._count.id || 0
        return {
          coinId,
          winRate:
            totalCount > 0
              ? parseFloat(((profitableCount / totalCount) * 100).toFixed(2))
              : 0
        }
      })
    )

    // Calculate win rate per strategy
    const winRateByStrategy = await Promise.all(
      strategyIds.map(async strategyId => {
        const profitableCount = await db.trade.count({
          where: {
            ...closedWhere,
            strategyId,
            profitLoss: { gt: 0 }
          }
        })
        const totalCount =
          tradesByStrategy.find(t => t.strategyId === strategyId)?._count.id ||
          0
        return {
          strategyId,
          winRate:
            totalCount > 0
              ? parseFloat(((profitableCount / totalCount) * 100).toFixed(2))
              : 0
        }
      })
    )

    // Map coin and strategy data
    const coinMap = new Map(coins.map(c => [c.id, c]))
    const strategyMap = new Map(strategies.map(s => [s.id, s]))
    const winRateByCoinMap = new Map(
      winRateByCoin.map(w => [w.coinId, w.winRate])
    )
    const winRateByStrategyMap = new Map(
      winRateByStrategy.map(w => [w.strategyId, w.winRate])
    )

    const byCoin = tradesByCoin.map(item => {
      const coin = coinMap.get(item.coinId)
      return {
        coinId: item.coinId,
        coinSymbol: coin?.symbol || '',
        coinName: coin?.name || '',
        trades: item._count.id,
        winRate: winRateByCoinMap.get(item.coinId) || 0,
        profitLoss: item._sum.profitLoss || 0
      }
    })

    const byStrategy = tradesByStrategy.map(item => {
      const strategy = strategyMap.get(item.strategyId)
      return {
        strategyId: item.strategyId,
        strategyName: strategy?.name || '',
        trades: item._count.id,
        winRate: winRateByStrategyMap.get(item.strategyId) || 0,
        profitLoss: item._sum.profitLoss || 0
      }
    })

    // Calculate total fees paid
    const allTradesForFees = await db.trade.findMany({
      where: baseWhere,
      select: {
        status: true,
        avgEntry: true,
        avgExit: true,
        quantity: true,
        entryFeePercentage: true,
        exitFeePercentage: true
      }
    })

    let totalFeesPaid = 0
    allTradesForFees.forEach(trade => {
      // Entry fees (all trades)
      const entryFee =
        (trade.entryFeePercentage / 100) * trade.avgEntry * trade.quantity
      totalFeesPaid += entryFee

      // Exit fees (only closed trades with exit data)
      if (
        trade.status === 'CLOSED' &&
        trade.avgExit &&
        trade.exitFeePercentage !== null &&
        trade.exitFeePercentage !== undefined
      ) {
        const exitFee =
          (trade.exitFeePercentage / 100) * trade.avgExit * trade.quantity
        totalFeesPaid += exitFee
      }
    })

    // Calculate trade duration analysis
    const closedTradesWithDates = await db.trade.findMany({
      where: closedWhere,
      select: {
        tradeDate: true,
        tradeTime: true,
        exitDate: true,
        exitTime: true
      }
    })

    // Define duration buckets
    const durationBuckets = {
      '0-30mins': 0,
      '30mins-24hours': 0,
      '1-7days': 0,
      '1-4weeks': 0,
      '4weeks+': 0
    }

    closedTradesWithDates.forEach(trade => {
      if (!trade.exitDate || !trade.exitTime) return

      // Combine date and time for entry and exit
      const entryDateTime = new Date(trade.tradeDate)
      const entryTime = new Date(trade.tradeTime)
      entryDateTime.setHours(entryTime.getUTCHours())
      entryDateTime.setMinutes(entryTime.getUTCMinutes())
      entryDateTime.setSeconds(entryTime.getUTCSeconds())

      const exitDateTime = new Date(trade.exitDate)
      const exitTime = new Date(trade.exitTime)
      exitDateTime.setHours(exitTime.getUTCHours())
      exitDateTime.setMinutes(exitTime.getUTCMinutes())
      exitDateTime.setSeconds(exitTime.getUTCSeconds())

      // Calculate duration in minutes
      const durationMinutes = (exitDateTime - entryDateTime) / (1000 * 60)

      // Categorize into buckets
      if (durationMinutes <= 30) {
        durationBuckets['0-30mins']++
      } else if (durationMinutes <= 1440) {
        // 24 hours = 1440 minutes
        durationBuckets['30mins-24hours']++
      } else if (durationMinutes <= 10080) {
        // 7 days = 10080 minutes
        durationBuckets['1-7days']++
      } else if (durationMinutes <= 40320) {
        // 28 days = 40320 minutes
        durationBuckets['1-4weeks']++
      } else {
        durationBuckets['4weeks+']++
      }
    })

    res.ok({
      totalTrades,
      openTrades,
      closedTrades,
      winRate,
      totalProfitLoss: aggregates._sum.profitLoss || 0,
      averageProfitLoss: aggregates._avg.profitLoss || 0,
      bestTrade: bestTrade?.profitLoss || 0,
      worstTrade: worstTrade?.profitLoss || 0,
      totalFeesPaid,
      byCoin,
      byStrategy,
      byDuration: durationBuckets
    })
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}

/**
 * Get daily P&L for calendar view
 * GET /api/trades/analytics/daily-pnl
 */
export const getDailyPnl = async (req, res) => {
  try {
    const context = req.context
    const { year, month } = req.query

    // Validate year and month
    const yearNum = parseInt(year, 10)
    const monthNum = parseInt(month, 10)

    if (!yearNum || !monthNum || monthNum < 1 || monthNum > 12) {
      return res.error({ message: 'Invalid year or month' })
    }

    // Calculate start and end dates for the month
    const startDate = new Date(yearNum, monthNum - 1, 1)
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999)

    // Get all closed trades for the month, grouped by date
    const trades = await db.trade.findMany({
      where: {
        organizationId: context.organization.id,
        status: 'CLOSED',
        tradeDate: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        tradeDate: true,
        profitLoss: true
      },
      orderBy: {
        tradeDate: 'asc'
      }
    })

    // Group trades by day and calculate daily P&L
    const dailyPnlMap = new Map()

    trades.forEach(trade => {
      const day = trade.tradeDate.getDate()
      const currentPnl = dailyPnlMap.get(day) || 0
      dailyPnlMap.set(day, currentPnl + (trade.profitLoss || 0))
    })

    // Convert map to array of objects
    const dailyPnl = Array.from(dailyPnlMap.entries()).map(([day, pnl]) => ({
      day,
      pnl: parseFloat(pnl.toFixed(2))
    }))

    res.ok({ dailyPnl, year: yearNum, month: monthNum })
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}
