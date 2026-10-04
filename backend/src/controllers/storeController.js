import { findStores } from '../models/storeModel.js'

function readSearchFilters(query) {
  const filters = {}

  for (const field of ['name', 'address']) {
    const value = query[field]
    if (value === undefined) continue
    if (typeof value !== 'string' || value.trim().length === 0) {
      return { error: `${field} search must be a non-empty string.` }
    }
    const trimmed = value.trim()
    const maxLength = field === 'name' ? 60 : 400
    if (trimmed.length > maxLength) {
      return { error: `${field} search must be ${maxLength} characters or fewer.` }
    }
    filters[field] = trimmed
  }

  return { filters }
}

export async function listStores(request, response, next) {
  const { error, filters } = readSearchFilters(request.query)
  if (error) {
    response.status(400).json({ status: 'error', error })
    return
  }

  try {
    const stores = await findStores({ userId: request.authUser.id, ...filters })
    response.json({ status: 'ok', total: stores.length, stores })
  } catch (queryError) {
    next(queryError)
  }
}

export async function searchStores(request, response, next) {
  const hasName = typeof request.query.name === 'string'
  const hasAddress = typeof request.query.address === 'string'
  if (!hasName && !hasAddress) {
    response.status(400).json({
      status: 'error',
      error: 'Provide a name or address query parameter.',
    })
    return
  }

  return listStores(request, response, next)
}
