export function validateEmail(value) {
  if (typeof value !== 'string' || value.length > 254) return false

  const parts = value.split('@')
  if (parts.length !== 2) return false
  const [local, domain] = parts
  if (
    local.length === 0 ||
    local.length > 64 ||
    local.startsWith('.') ||
    local.endsWith('.') ||
    local.includes('..') ||
    !/^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local)
  ) {
    return false
  }

  const labels = domain.split('.')
  return (
    labels.length > 1 &&
    labels.every((label) => (
      label.length > 0 &&
      label.length <= 63 &&
      /^[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?$/i.test(label)
    ))
  )
}

export function validatePassword(value) {
  return (
    typeof value === 'string' &&
    value.length >= 8 &&
    value.length <= 16 &&
    /[A-Z]/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  )
}

export function validateRegistration(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Provide registration details.'
  }
  if (typeof body.name !== 'string' || body.name.trim().length < 20 || body.name.trim().length > 60) {
    return 'Name must be between 20 and 60 characters.'
  }
  if (!validateEmail(body.email)) {
    return 'Enter a valid email address.'
  }
  if (typeof body.address !== 'string' || body.address.trim().length === 0 || body.address.trim().length > 400) {
    return 'Enter an address of 400 characters or fewer.'
  }
  if (!validatePassword(body.password)) {
    return 'Password must be 8–16 characters and include an uppercase letter and a special character.'
  }

  return null
}

export function validateNewPassword(value) {
  return validatePassword(value)
    ? null
    : 'Password must be 8–16 characters and include an uppercase letter and a special character.'
}
