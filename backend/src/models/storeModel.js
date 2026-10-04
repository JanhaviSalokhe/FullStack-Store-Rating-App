import pool from '../config/database.js'

function escapeLikeValue(value) {
  return value.replaceAll('!', '!!').replaceAll('%', '!%').replaceAll('_', '!_')
}

export async function findStores({ userId, name, address }) {
  const filters = []
  const values = [userId]

  if (name) {
    filters.push("s.name LIKE ? ESCAPE '!'")
    values.push(`%${escapeLikeValue(name)}%`)
  }
  if (address) {
    filters.push("s.address LIKE ? ESCAPE '!'")
    values.push(`%${escapeLikeValue(address)}%`)
  }

  const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : ''
  const [rows] = await pool.execute(
    `SELECT
       s.id,
       s.name,
       s.email,
       s.address,
       COALESCE(ROUND(AVG(all_ratings.rating), 2), 0) AS overallRating,
       COUNT(all_ratings.id) AS ratingCount,
       own_rating.id AS userRatingId,
       own_rating.rating AS userRating
     FROM stores s
     LEFT JOIN ratings all_ratings ON all_ratings.store_id = s.id
     LEFT JOIN ratings own_rating
       ON own_rating.store_id = s.id AND own_rating.user_id = ?
     ${whereClause}
     GROUP BY s.id, s.name, s.email, s.address, own_rating.id, own_rating.rating
     ORDER BY s.name ASC, s.id ASC`,
    values,
  )

  return rows.map((store) => ({
    ...store,
    id: String(store.id),
    overallRating: Number(store.overallRating),
    ratingCount: Number(store.ratingCount),
    userRatingId: store.userRatingId === null ? null : String(store.userRatingId),
    userRating: store.userRating === null ? null : Number(store.userRating),
  }))
}
