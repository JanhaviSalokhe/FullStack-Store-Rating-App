import pool from '../config/database.js'

export async function getAdminDashboard() {
  const [rows] = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM users) AS totalUsers,
      (SELECT COUNT(*) FROM stores) AS totalStores,
      (SELECT COUNT(*) FROM ratings) AS totalRatings
  `)
  const totals = rows[0]
  return {
    totalUsers: Number(totals.totalUsers),
    totalStores: Number(totals.totalStores),
    totalRatings: Number(totals.totalRatings),
  }
}

export async function getNormalUserDashboard(userId) {
  const [rows] = await pool.execute(
    'SELECT COUNT(*) AS totalRatings FROM ratings WHERE user_id = ?',
    [userId],
  )
  return { totalRatings: Number(rows[0].totalRatings) }
}

export async function getStoreOwnerStores(ownerId) {
  const [storeRows] = await pool.execute(
    `SELECT
       s.id,
       s.name,
       s.email,
       s.address,
       COALESCE(AVG(r.rating), 0) AS averageRating,
       COUNT(r.id) AS totalRatings
     FROM stores s
     LEFT JOIN ratings r ON r.store_id = s.id
     WHERE s.owner_id = ?
     GROUP BY s.id, s.name, s.email, s.address
     ORDER BY s.name ASC`,
    [ownerId],
  )

  return storeRows.map((store) => ({
    ...store,
    id: String(store.id),
    averageRating: Number(store.averageRating),
    totalRatings: Number(store.totalRatings),
  }))
}

export async function getStoreOwnerRatings(ownerId) {
  const [ratingRows] = await pool.execute(
    `SELECT
       s.id AS storeId,
       s.name AS storeName,
       u.id AS userId,
       u.name AS userName,
       u.email AS userEmail,
       r.rating,
       r.updated_at AS updatedAt
     FROM stores s
     INNER JOIN ratings r ON r.store_id = s.id
     INNER JOIN users u ON u.id = r.user_id
     WHERE s.owner_id = ?
     ORDER BY r.updated_at DESC, u.name ASC`,
    [ownerId],
  )

  return ratingRows.map((rating) => ({
    ...rating,
    storeId: String(rating.storeId),
    userId: String(rating.userId),
    rating: Number(rating.rating),
  }))
}

export async function getStoreOwnerDashboard(ownerId) {
  const [stores, ratings] = await Promise.all([
    getStoreOwnerStores(ownerId),
    getStoreOwnerRatings(ownerId),
  ])

  return {
    stores,
    ratings,
  }
}
