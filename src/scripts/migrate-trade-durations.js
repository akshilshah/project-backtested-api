import { db } from '../config/db.js'

/**
 * Migration script to recalculate trade durations with time component
 * Run this once to update all existing closed trades
 */
async function migrateTradeDurations() {
  try {
    console.log('Starting trade duration migration...')

    // Get all closed trades
    const closedTrades = await db.trade.findMany({
      where: {
        status: 'CLOSED',
        exitDate: { not: null },
        exitTime: { not: null }
      },
      select: {
        id: true,
        tradeDate: true,
        tradeTime: true,
        exitDate: true,
        exitTime: true,
        duration: true
      }
    })

    console.log(`Found ${closedTrades.length} closed trades to migrate`)

    let updatedCount = 0

    for (const trade of closedTrades) {
      try {
        // Calculate duration in hours (including time component)
        const entryDateTime = new Date(
          trade.tradeDate.getFullYear(),
          trade.tradeDate.getMonth(),
          trade.tradeDate.getDate(),
          trade.tradeTime.getUTCHours(),
          trade.tradeTime.getUTCMinutes(),
          trade.tradeTime.getUTCSeconds()
        )

        const exitDateTime = new Date(
          trade.exitDate.getFullYear(),
          trade.exitDate.getMonth(),
          trade.exitDate.getDate(),
          trade.exitTime.getUTCHours(),
          trade.exitTime.getUTCMinutes(),
          trade.exitTime.getUTCSeconds()
        )

        const durationMs = exitDateTime.getTime() - entryDateTime.getTime()
        const newDuration = Math.round((durationMs / (1000 * 60 * 60)) * 10) / 10

        // Update only if duration changed
        if (newDuration !== trade.duration) {
          await db.trade.update({
            where: { id: trade.id },
            data: { duration: newDuration }
          })

          console.log(
            `Trade #${trade.id}: ${trade.duration} days → ${newDuration} hours`
          )
          updatedCount++
        }
      } catch (err) {
        console.error(`Error processing trade #${trade.id}:`, err.message)
      }
    }

    console.log(`\nMigration complete! Updated ${updatedCount} trades.`)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

// Run the migration
migrateTradeDurations()
