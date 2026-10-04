import pool from '../config/database.js'

export async function createRating({ userId, storeId, rating }) {
  const [result] = await pool.execute(
    'INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?)',
    [userId, storeId, rating],
  )
  const [rows] = await pool.execute(
    `SELECT id, user_id AS userId, store_id AS storeId, rating,
            created_at AS createdAt, updated_at AS updatedAt
     FROM ratings
     WHERE id = ? AND user_id = ?`,
    [result.insertId, userId],
  )
  return rows[0]
}

export async function updateRating({ ratingId, userId, rating }) {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()
    const [rows] = await connection.execute(
      'SELECT id FROM ratings WHERE id = ? AND user_id = ? FOR UPDATE',
      [ratingId, userId],
    )
    if (rows.length === 0) {
      await connection.rollback()
      return null
    }

    await connection.execute(
      'UPDATE ratings SET rating = ? WHERE id = ? AND user_id = ?',
      [rating, ratingId, userId],
    )
    const [updatedRows] = await connection.execute(
      `SELECT id, user_id AS userId, store_id AS storeId, rating,
              created_at AS createdAt, updated_at AS updatedAt
       FROM ratings
       WHERE id = ? AND user_id = ?`,
      [ratingId, userId],
    )
    await connection.commit()
    return updatedRows[0]
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}
