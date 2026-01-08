import { db } from '../config/db'

export const ping = async (req, res) => {
  try {
    await db.ping.findFirst()
    res.ok('pong')
  } catch (err) {
    res.error('dong')
  }
}
