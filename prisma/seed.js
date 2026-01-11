const { PrismaPg } = require('@prisma/adapter-pg')
require('dotenv/config')

const { PrismaClient } = require('./generated')

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})
const db = new PrismaClient({ adapter })

const TOP_10_COINS = [
  { name: 'Bitcoin', symbol: 'BTC', description: 'The first and largest cryptocurrency by market cap' },
  { name: 'Ethereum', symbol: 'ETH', description: 'Decentralized platform for smart contracts and DApps' },
  { name: 'Tether', symbol: 'USDT', description: 'Stablecoin pegged to US Dollar' },
  { name: 'BNB', symbol: 'BNB', description: 'Native token of Binance ecosystem' },
  { name: 'Solana', symbol: 'SOL', description: 'High-performance blockchain for DApps' },
  { name: 'XRP', symbol: 'XRP', description: 'Digital payment protocol and cryptocurrency' },
  { name: 'USD Coin', symbol: 'USDC', description: 'Stablecoin pegged to US Dollar' },
  { name: 'Cardano', symbol: 'ADA', description: 'Proof-of-stake blockchain platform' },
  { name: 'Avalanche', symbol: 'AVAX', description: 'Platform for decentralized applications' },
  { name: 'Dogecoin', symbol: 'DOGE', description: 'Meme cryptocurrency with strong community' }
]

const TRADING_STRATEGIES = [
  { name: 'MACD', description: 'Moving Average Convergence Divergence - momentum indicator', rules: { type: 'momentum', indicators: ['MACD', 'Signal Line'] } },
  { name: 'Bollinger Bands', description: 'Volatility indicator with upper and lower bands', rules: { type: 'volatility', indicators: ['SMA', 'Upper Band', 'Lower Band'] } },
  { name: 'Moving Average Crossover', description: 'Buy/sell signals from MA crossovers', rules: { type: 'trend', indicators: ['SMA', 'EMA'] } },
  { name: 'Fibonacci Retracement', description: 'Support/resistance levels based on Fibonacci ratios', rules: { type: 'support_resistance', levels: [0.236, 0.382, 0.5, 0.618, 0.786] } },
  { name: 'Support & Resistance', description: 'Trading based on key price levels', rules: { type: 'support_resistance', indicators: ['Horizontal Levels'] } },
  { name: 'Breakout Trading', description: 'Enter trades when price breaks key levels', rules: { type: 'breakout', indicators: ['Volume', 'Price Action'] } },
  { name: 'Trend Following', description: 'Trade in direction of established trend', rules: { type: 'trend', indicators: ['ADX', 'Moving Averages'] } },
  { name: 'Scalping', description: 'Quick trades capturing small price movements', rules: { type: 'scalping', timeframe: '1m-15m', indicators: ['Volume', 'Order Flow'] } },
  { name: 'Swing Trading', description: 'Hold positions for days to weeks', rules: { type: 'swing', timeframe: '4h-1d', indicators: ['RSI', 'MACD', 'Support/Resistance'] } }
]

async function main() {
  console.log('Starting seed...')

  // Get first user and organization
  const user = await db.user.findFirst()

  if (!user) {
    console.log('No user found. Please create a user first via signup.')
    return
  }

  console.log(`Using user: ${user.email}, org: ${user.organizationId}`)

  // Insert coins
  console.log('\nInserting coins...')
  for (const coin of TOP_10_COINS) {
    const existing = await db.coin.findFirst({
      where: { symbol: coin.symbol, organizationId: user.organizationId }
    })

    if (existing) {
      console.log(`  ⏭ ${coin.symbol} already exists`)
    } else {
      await db.coin.create({
        data: {
          ...coin,
          organizationId: user.organizationId,
          createdById: user.id
        }
      })
      console.log(`  ✓ ${coin.symbol} created`)
    }
  }

  // Insert strategies
  console.log('\nInserting strategies...')
  for (const strategy of TRADING_STRATEGIES) {
    const existing = await db.strategy.findFirst({
      where: { name: strategy.name, organizationId: user.organizationId }
    })

    if (existing) {
      console.log(`  ⏭ ${strategy.name} already exists`)
    } else {
      await db.strategy.create({
        data: {
          ...strategy,
          organizationId: user.organizationId,
          createdById: user.id
        }
      })
      console.log(`  ✓ ${strategy.name} created`)
    }
  }

  console.log('\nSeed completed!')
}

main()
  .catch(e => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
