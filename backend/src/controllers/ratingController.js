import { createRating, updateRating } from '../models/ratingModel.js'

function validateRating(value) {
  return Number.isInteger(value) && value >= 1 && value <= 5
}

function validateStoreId(value) {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value > 0 ? String(value) : null
  }

  if (typeof value === 'string' && /^[1-9]\d{0,19}$/.test(value)) {
    return BigInt(value) <= 18446744073709551615n ? value : null
  }

  return null
}

export async function submitRating(request, response, next) {
  const storeId = validateStoreId(request.body?.storeId)
  const { rating } = request.body || {}
  if (!storeId || !validateRating(rating)) {
    response.status(400).json({
      status: 'error',
      error: 'Provide a valid storeId and a whole-number rating from 1 to 5.',
    })
    return
  }

  try {
    const created = await createRating({
      userId: request.authUser.id,
      storeId,
      rating,
    })
    response.status(201).json({ status: 'ok', rating: created })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      response.status(409).json({
        status: 'error',
        error: 'You have already rated this store. Update your existing rating instead.',
      })
      return
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      response.status(404).json({ status: 'error', error: 'Store not found.' })
      return
    }
    next(error)
  }
}

export async function modifyRating(request, response, next) {
  const { id } = request.params
  const { rating } = request.body || {}
  if (!/^[1-9]\d{0,19}$/.test(id) || BigInt(id) > 18446744073709551615n) {
    response.status(400).json({ status: 'error', error: 'Provide a valid rating ID.' })
    return
  }
  if (!validateRating(rating)) {
    response.status(400).json({
      status: 'error',
      error: 'Rating must be a whole number from 1 to 5.',
    })
    return
  }

  try {
    const updated = await updateRating({
      ratingId: id,
      userId: request.authUser.id,
      rating,
    })
    if (!updated) {
      response.status(404).json({
        status: 'error',
        error: 'Rating not found.',
      })
      return
    }
    response.json({ status: 'ok', rating: updated })
  } catch (error) {
    next(error)
  }
}
