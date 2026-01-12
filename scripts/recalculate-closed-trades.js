/**
 * Script to recalculate profitLoss for all closed trades
 * Run this after fixing the exitTrade function to update historical data
 *
 * Usage: node scripts/recalculate-closed-trades.js
 */

require('dotenv').config()
const { PrismaClient } = require('../prisma/generated')
const { PrismaPg } = require('@prisma/adapter-pg')

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})
const db = new PrismaClient({ adapter })

const calculateProfitLoss = trade => {
  // Determine trade direction
  const direction = trade.avgEntry < trade.stopLoss ? 'Short' : 'Long'

  // Calculate risk-based position size
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

  // Calculate commission
  const entryCommission = 0.0002 * tradeValue
  const exitCommission = 0.0005 * trade.avgExit * positionSize
  const commission = entryCommission + exitCommission

  // Calculate P&L based on direction
  let grossProfitLoss
  if (direction === 'Short') {
    grossProfitLoss = (trade.avgEntry - trade.avgExit) * positionSize
  } else {
    grossProfitLoss = (trade.avgExit - trade.avgEntry) * positionSize
  }

  // Net P&L after commission
  const profitLoss = grossProfitLoss - commission
  const profitLossPercentage = (profitLoss / trade.amount) * 100

  return {
    direction,
    positionSize,
    commission,
    profitLoss,
    profitLossPercentage
  }
}

const main = async () => {
  console.log('🔄 Recalculating profit/loss for all closed trades...\n')

  try {
    // Fetch all closed trades
    const closedTrades = await db.trade.findMany({
      where: {
        status: 'CLOSED'
      },
      orderBy: {
        id: 'asc'
      }
    })

    console.log(`Found ${closedTrades.length} closed trades\n`)

    if (closedTrades.length === 0) {
      console.log('✅ No closed trades to recalculate')
      return
    }

    let updated = 0
    let errors = 0
    const changes = []

    for (const trade of closedTrades) {
      try {
        // Calculate new values
        const calculated = calculateProfitLoss(trade)

        // Check if values are different
        const plDiff = Math.abs((trade.profitLoss || 0) - calculated.profitLoss)
        const plPctDiff = Math.abs(
          (trade.profitLossPercentage || 0) - calculated.profitLossPercentage
        )

        if (plDiff > 0.001 || plPctDiff > 0.001) {
          // Update the trade
          await db.trade.update({
            where: { id: trade.id },
            data: {
              profitLoss: calculated.profitLoss,
              profitLossPercentage: calculated.profitLossPercentage
            }
          })

          changes.push({
            id: trade.id,
            direction: calculated.direction,
            old: {
              profitLoss: trade.profitLoss,
              profitLossPercentage: trade.profitLossPercentage
            },
            new: {
              profitLoss: calculated.profitLoss,
              profitLossPercentage: calculated.profitLossPercentage
            }
          })

          updated++
          console.log(
            `✓ Trade #${trade.id} (${calculated.direction}): ${trade.profitLoss?.toFixed(2)} → ${calculated.profitLoss.toFixed(2)}`
          )
        } else {
          console.log(`- Trade #${trade.id}: No change needed`)
        }
      } catch (error) {
        errors++
        console.error(`✗ Trade #${trade.id}: ${error.message}`)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log(`✅ Recalculation complete!`)
    console.log(`   Total trades: ${closedTrades.length}`)
    console.log(`   Updated: ${updated}`)
    console.log(`   Unchanged: ${closedTrades.length - updated - errors}`)
    console.log(`   Errors: ${errors}`)

    if (changes.length > 0) {
      console.log('\n📊 Summary of changes:')
      changes.forEach(change => {
        const oldSign = change.old.profitLoss >= 0 ? '+' : ''
        const newSign = change.new.profitLoss >= 0 ? '+' : ''
        console.log(
          `   Trade #${change.id} (${change.direction}): ${oldSign}${change.old.profitLoss?.toFixed(2)} → ${newSign}${change.new.profitLoss.toFixed(2)}`
        )
      })
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

main()
