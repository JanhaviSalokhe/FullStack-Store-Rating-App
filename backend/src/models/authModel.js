import pool from '../config/database.js'

const userColumns = `
  id,
  name,
  email,
  password_hash,
  address,
  role,
  auth_token_version
`

export async function findUserByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT ${userColumns} FROM users WHERE email = ?`,
    [email],
  )
  return rows[0] || null
}

export async function findUserById(id) {
  const [rows] = await pool.execute(
    `SELECT ${userColumns} FROM users WHERE id = ?`,
    [id],
  )
  return rows[0] || null
}

export async function createNormalUser({ name, email, passwordHash, address }) {
  const [result] = await pool.execute(
    `INSERT INTO users (name, email, password_hash, address, role)
     VALUES (?, ?, ?, ?, 'normal_user')`,
    [name, email, passwordHash, address],
  )
  return findUserById(String(result.insertId))
}

export async function updatePassword({ id, currentVersion, passwordHash }) {
  const [result] = await pool.execute(
    `UPDATE users
     SET password_hash = ?, auth_token_version = auth_token_version + 1
     WHERE id = ? AND auth_token_version = ?`,
    [passwordHash, id, currentVersion],
  )
  return result.affectedRows === 1
}

export async function invalidateSessions({ id, currentVersion }) {
  const [result] = await pool.execute(
    `UPDATE users
     SET auth_token_version = auth_token_version + 1
     WHERE id = ? AND auth_token_version = ?`,
    [id, currentVersion],
  )
  return result.affectedRows === 1
}
