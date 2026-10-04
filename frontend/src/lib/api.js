export async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    credentials: 'same-origin',
    headers: options.body
      ? { 'Content-Type': 'application/json', ...options.headers }
      : options.headers,
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  })

  const result = await response.json()
  if (!response.ok) {
    const error = new Error(result.error || 'The request could not be completed.')
    error.status = response.status
    throw error
  }

  return result
}
