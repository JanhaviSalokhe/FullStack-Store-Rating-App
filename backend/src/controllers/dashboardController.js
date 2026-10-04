import {
  getAdminDashboard,
  getNormalUserDashboard,
  getStoreOwnerDashboard,
  getStoreOwnerRatings,
  getStoreOwnerStores,
} from '../models/dashboardModel.js'

export async function adminDashboard(_request, response, next) {
  try {
    const dashboard = await getAdminDashboard()
    response.json({ status: 'ok', dashboard })
  } catch (error) {
    next(error)
  }
}

export async function normalUserDashboard(request, response, next) {
  try {
    const dashboard = await getNormalUserDashboard(request.authUser.id)
    response.json({ status: 'ok', dashboard })
  } catch (error) {
    next(error)
  }
}

export async function storeOwnerDashboard(request, response, next) {
  try {
    const dashboard = await getStoreOwnerDashboard(request.authUser.id)
    response.json({ status: 'ok', dashboard })
  } catch (error) {
    next(error)
  }
}

export async function ownerDashboard(request, response, next) {
  try {
    const stores = await getStoreOwnerStores(request.authUser.id)
    response.json({ status: 'ok', dashboard: { stores } })
  } catch (error) {
    next(error)
  }
}

export async function ownerRatings(request, response, next) {
  try {
    const ratings = await getStoreOwnerRatings(request.authUser.id)
    response.json({ status: 'ok', total: ratings.length, ratings })
  } catch (error) {
    next(error)
  }
}
