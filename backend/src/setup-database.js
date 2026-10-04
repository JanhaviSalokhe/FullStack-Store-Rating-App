import 'dotenv/config'
import mysql from 'mysql2/promise'
import { readFile } from 'node:fs/promises'

const database = process.env.DB_NAME || 'store_rating_app'
if (!/^[A-Za-z0-9_]+$/.test(database)) {
  throw new Error('DB_NAME may contain only letters, numbers, and underscores.')
}

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
})

try {
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`,
  )
  await connection.query(`USE \`${database}\``)

  const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8')
  for (const statement of schema.split(';').map((part) => part.trim()).filter(Boolean)) {
    await connection.query(statement)
  }

  const [columns] = await connection.query(
    `SHOW COLUMNS FROM users LIKE 'auth_token_version'`,
  )
  if (columns.length === 0) {
    await connection.query(
      'ALTER TABLE users ADD COLUMN auth_token_version INT UNSIGNED NOT NULL DEFAULT 0',
    )
  }

  console.log(`Database "${database}" and its tables are ready.`)
} finally {
  await connection.end()
}
