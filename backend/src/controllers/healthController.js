import checkDatabase from '../models/healthModel.js'

async function getHealth(_request, response, next) {
  try {
    await checkDatabase()
    response.json({ status: 'ok', api: 'connected', database: 'connected' })
  } catch (error) {
    console.error('MySQL health check failed:', error.message)
    response.status(503).json({
      status: 'error',
      api: 'connected',
      database: 'disconnected',
      error: 'Database unavailable',
    })
  }
}

export default getHealth
