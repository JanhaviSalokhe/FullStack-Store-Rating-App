function errorHandler(error, _request, response, _next) {
  const statusCode = Number.isInteger(error.status) ? error.status : 500

  if (statusCode >= 500) {
    console.error('API request failed:', error.message)
  }

  response.status(statusCode).json({
    status: 'error',
    error: statusCode === 500 ? 'Internal server error' : error.message,
  })
}

export default errorHandler
