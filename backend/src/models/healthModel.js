import pool from '../config/database.js'

async function checkDatabase() {
  await pool.query('SELECT 1')
}

export default checkDatabase
