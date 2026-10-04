function notFound(_request, response) {
  response.status(404).json({
    status: 'error',
    error: 'Route not found',
  })
}

export default notFound
