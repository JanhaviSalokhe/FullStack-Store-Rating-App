import pool from '../config/database.js'

const userSortColumns = {
  name: 'u.name',
  email: 'u.email',
  address: 'u.address',
  role: 'u.role',
}

const storeSortColumns = {
  name: 's.name',
  email: 's.email',
  address: 's.address',
  rating: 'averageRating',
}

function escapeLikeValue(value) {
  return value.replaceAll('!', '!!').replaceAll('%', '!%').replaceAll('_', '!_')
}

function searchPattern(value) {
  return `%${escapeLikeValue(value)}%`
}

function makeOrderBy(sortColumns, sortBy, order, tieBreaker) {
  const column = sortColumns[sortBy]
  if (!column) return { error: `sortBy must be one of: ${Object.keys(sortColumns).join(', ')}.` }
  if (order !== 'asc' && order !== 'desc') {
    return { error: 'order must be either asc or desc.' }
  }
  return { clause: `ORDER BY ${column} ${order.toUpperCase()}, ${tieBreaker} ASC` }
}

export async function createAdminUser({ name, email, passwordHash, address, role }) {
  const [result] = await pool.execute(
    'INSERT INTO users (name, email, password_hash, address, role) VALUES (?, ?, ?, ?, ?)',
    [name, email, passwordHash, address, role],
  )
  const [rows] = await pool.execute(
    `SELECT id, name, email, address, role
     FROM users
     WHERE id = ?`,
    [result.insertId],
  )
  return { ...rows[0], id: String(rows[0].id) }
}

export async function findStoreOwner(ownerId) {
  const [rows] = await pool.execute(
    'SELECT id, role FROM users WHERE id = ?',
    [ownerId],
  )
  return rows[0] || null
}

export async function createStore({ name, email, address, ownerId }) {
  const [result] = await pool.execute(
    'INSERT INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)',
    [name, email, address, ownerId],
  )
  const [rows] = await pool.execute(
    `SELECT id, name, email, address, owner_id AS ownerId
     FROM stores
     WHERE id = ?`,
    [result.insertId],
  )
  const store = rows[0]
  return { ...store, id: String(store.id), ownerId: store.ownerId === null ? null : String(store.ownerId) }
}

export async function listAdminUsers({ name, email, address, role, sortBy, order }) {
  const ordering = makeOrderBy(userSortColumns, sortBy, order, 'u.id')
  if (ordering.error) return { error: ordering.error }

  const conditions = []
  const values = []
  for (const [field, value] of [['name', name], ['email', email], ['address', address]]) {
    if (value !== undefined) {
      conditions.push(`u.${field} LIKE ? ESCAPE '!'`)
      values.push(searchPattern(value))
    }
  }
  if (role !== undefined) {
    conditions.push('u.role = ?')
    values.push(role)
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const [rows] = await pool.execute(
    `SELECT
       u.id,
       u.name,
       u.email,
       u.address,
       u.role,
       CASE WHEN u.role = 'store_owner' THEN (
         SELECT ROUND(AVG(owner_ratings.rating), 2)
         FROM stores owner_stores
         LEFT JOIN ratings owner_ratings ON owner_ratings.store_id = owner_stores.id
         WHERE owner_stores.owner_id = u.id
       ) ELSE NULL END AS ownerRating
     FROM users u
     ${whereClause}
     ${ordering.clause}`,
    values,
  )

  return {
    users: rows.map((user) => ({
      ...user,
      id: String(user.id),
      ownerRating: user.ownerRating === null ? null : Number(user.ownerRating),
    })),
  }
}

export async function listAdminStores({ name, email, address, sortBy, order }) {
  const ordering = makeOrderBy(storeSortColumns, sortBy, order, 's.id')
  if (ordering.error) return { error: ordering.error }

  const conditions = []
  const values = []
  for (const [field, value] of [['name', name], ['email', email], ['address', address]]) {
    if (value !== undefined) {
      conditions.push(`s.${field} LIKE ? ESCAPE '!'`)
      values.push(searchPattern(value))
    }
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const [rows] = await pool.execute(
    `SELECT
       s.id,
       s.name,
       s.email,
       s.address,
       s.owner_id AS ownerId,
       COALESCE(ROUND(AVG(r.rating), 2), 0) AS averageRating,
       COUNT(r.id) AS ratingCount
     FROM stores s
     LEFT JOIN ratings r ON r.store_id = s.id
     ${whereClause}
     GROUP BY s.id, s.name, s.email, s.address, s.owner_id
     ${ordering.clause}`,
    values,
  )

  return {
    stores: rows.map((store) => ({
      ...store,
      id: String(store.id),
      ownerId: store.ownerId === null ? null : String(store.ownerId),
      averageRating: Number(store.averageRating),
      ratingCount: Number(store.ratingCount),
    })),
  }
}

export async function findAdminUserDetails(id) {
  const [rows] = await pool.execute(
    `SELECT id, name, email, address, role
     FROM users
     WHERE id = ?`,
    [id],
  )
  const user = rows[0]
  if (!user) return null

  const result = { ...user, id: String(user.id) }
  if (user.role === 'store_owner') {
    const [ratingRows] = await pool.execute(
      `SELECT AVG(r.rating) AS ownerRating
       FROM stores s
       INNER JOIN ratings r ON r.store_id = s.id
       WHERE s.owner_id = ?`,
      [user.id],
    )
    const [stores] = await pool.execute(
      `SELECT
         s.id,
         s.name,
         s.email,
         s.address,
         COALESCE(ROUND(AVG(r.rating), 2), 0) AS averageRating,
         COUNT(r.id) AS ratingCount
       FROM stores s
       LEFT JOIN ratings r ON r.store_id = s.id
       WHERE s.owner_id = ?
       GROUP BY s.id, s.name, s.email, s.address
       ORDER BY s.name ASC`,
      [user.id],
    )
    result.ownerRating = ratingRows[0].ownerRating === null
      ? null
      : Number(Number(ratingRows[0].ownerRating).toFixed(2))
    result.stores = stores.map((store) => ({
      ...store,
      id: String(store.id),
      averageRating: Number(store.averageRating),
      ratingCount: Number(store.ratingCount),
    }))
  }

  return result
}
