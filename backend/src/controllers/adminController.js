import bcrypt from 'bcryptjs'
import {
  createAdminUser,
  createStore,
  findAdminUserDetails,
  findStoreOwner,
  listAdminStores,
  listAdminUsers,
} from '../models/adminModel.js'
import { getAdminDashboard } from '../models/dashboardModel.js'
import { validateEmail, validatePassword } from '../utils/authValidation.js'

const userRoles = new Set(['normal_user', 'system_administrator'])
const allUserRoles = new Set(['normal_user', 'system_administrator', 'store_owner'])
const sortDirections = new Set(['asc', 'desc'])

function validationError(body, { includeRole = false, store = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Provide valid details.'
  }
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (
    !name ||
    name.length < 20 ||
    name.length > 60
  ) {
    return 'Name must be between 20 and 60 characters.'
  }
  if (typeof body.email !== 'string' || !validateEmail(body.email.trim())) {
    return 'Enter a valid email address.'
  }
  if (
    typeof body.address !== 'string' ||
    body.address.trim().length === 0 ||
    body.address.trim().length > 400
  ) {
    return 'Enter an address of 400 characters or fewer.'
  }
  if (!store && !validatePassword(body.password)) {
    return 'Password must be 8–16 characters and include an uppercase letter and a special character.'
  }
  if (includeRole && !userRoles.has(body.role)) {
    return 'Role must be normal_user or system_administrator.'
  }
  return null
}

function readFilters(query, { allowRole = false, storeSort = false } = {}) {
  const filters = {}
  for (const field of ['name', 'email', 'address']) {
    if (query[field] === undefined) continue
    if (typeof query[field] !== 'string' || query[field].trim().length === 0) {
      return { error: `${field} filter must be a non-empty string.` }
    }
    const value = query[field].trim()
    const maxLength = field === 'address' ? 400 : field === 'name' ? 60 : 254
    if (value.length > maxLength) {
      return { error: `${field} filter must be ${maxLength} characters or fewer.` }
    }
    filters[field] = value
  }

  if (allowRole && query.role !== undefined) {
    if (typeof query.role !== 'string' || !allUserRoles.has(query.role)) {
      return { error: 'role must be normal_user, system_administrator, or store_owner.' }
    }
    filters.role = query.role
  }

  const sortBy = query.sortBy === undefined ? 'name' : query.sortBy
  const order = query.order === undefined ? 'asc' : query.order
  const allowedSorts = storeSort
    ? ['name', 'email', 'address', 'rating']
    : ['name', 'email', 'address', 'role']
  if (typeof sortBy !== 'string' || !allowedSorts.includes(sortBy)) {
    return { error: `sortBy must be one of: ${allowedSorts.join(', ')}.` }
  }
  if (typeof order !== 'string' || !sortDirections.has(order.toLowerCase())) {
    return { error: 'order must be either asc or desc.' }
  }

  return { filters: { ...filters, sortBy, order: order.toLowerCase() } }
}

function validId(value) {
  return typeof value === 'string' &&
    /^[1-9]\d{0,19}$/.test(value) &&
    BigInt(value) <= 18446744073709551615n
}

export async function adminDashboard(_request, response, next) {
  try {
    const dashboard = await getAdminDashboard()
    response.json({ status: 'ok', dashboard })
  } catch (error) {
    next(error)
  }
}

export async function addUser(request, response, next) {
  const error = validationError(request.body, { includeRole: true })
  if (error) {
    response.status(400).json({ status: 'error', error })
    return
  }

  try {
    const user = await createAdminUser({
      name: request.body.name.trim(),
      email: request.body.email.trim().toLowerCase(),
      passwordHash: await bcrypt.hash(request.body.password, 12),
      address: request.body.address.trim(),
      role: request.body.role,
    })
    response.status(201).json({ status: 'ok', user })
  } catch (createError) {
    if (createError.code === 'ER_DUP_ENTRY') {
      response.status(409).json({ status: 'error', error: 'A user with this email already exists.' })
      return
    }
    next(createError)
  }
}

export async function addStore(request, response, next) {
  const error = validationError(request.body, { store: true })
  if (error) {
    response.status(400).json({ status: 'error', error })
    return
  }

  const { ownerId } = request.body
  if (ownerId !== undefined && ownerId !== null && !(
    (typeof ownerId === 'string' && validId(ownerId)) ||
    (typeof ownerId === 'number' && Number.isSafeInteger(ownerId) && ownerId > 0)
  )) {
    response.status(400).json({ status: 'error', error: 'ownerId must be a valid store-owner user ID.' })
    return
  }

  try {
    let normalizedOwnerId = ownerId === undefined || ownerId === null ? null : String(ownerId)
    if (normalizedOwnerId !== null) {
      const owner = await findStoreOwner(normalizedOwnerId)
      if (!owner) {
        response.status(404).json({ status: 'error', error: 'Store owner not found.' })
        return
      }
      if (owner.role !== 'store_owner') {
        response.status(400).json({ status: 'error', error: 'ownerId must belong to a store_owner account.' })
        return
      }
    }

    const store = await createStore({
      name: request.body.name.trim(),
      email: request.body.email.trim().toLowerCase(),
      address: request.body.address.trim(),
      ownerId: normalizedOwnerId,
    })
    response.status(201).json({ status: 'ok', store })
  } catch (createError) {
    if (createError.code === 'ER_DUP_ENTRY') {
      response.status(409).json({ status: 'error', error: 'A store with this email already exists.' })
      return
    }
    next(createError)
  }
}

export async function getUsers(request, response, next) {
  const { error, filters } = readFilters(request.query, { allowRole: true })
  if (error) {
    response.status(400).json({ status: 'error', error })
    return
  }

  try {
    const result = await listAdminUsers(filters)
    if (result.error) {
      response.status(400).json({ status: 'error', error: result.error })
      return
    }
    response.json({ status: 'ok', total: result.users.length, users: result.users })
  } catch (queryError) {
    next(queryError)
  }
}

export async function getStores(request, response, next) {
  const { error, filters } = readFilters(request.query, { storeSort: true })
  if (error) {
    response.status(400).json({ status: 'error', error })
    return
  }

  try {
    const result = await listAdminStores(filters)
    if (result.error) {
      response.status(400).json({ status: 'error', error: result.error })
      return
    }
    response.json({ status: 'ok', total: result.stores.length, stores: result.stores })
  } catch (queryError) {
    next(queryError)
  }
}

export async function getUserDetails(request, response, next) {
  if (!validId(request.params.id)) {
    response.status(400).json({ status: 'error', error: 'Provide a valid user ID.' })
    return
  }

  try {
    const user = await findAdminUserDetails(request.params.id)
    if (!user) {
      response.status(404).json({ status: 'error', error: 'User not found.' })
      return
    }
    response.json({ status: 'ok', user })
  } catch (error) {
    next(error)
  }
}
