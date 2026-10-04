import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {
  authCookieName,
  clearCookieOptions,
  cookieOptions,
  jwtExpiresIn,
  jwtSecretKey,
} from '../config/auth.js'
import {
  createNormalUser,
  findUserByEmail,
  invalidateSessions,
  updatePassword,
} from '../models/authModel.js'
import {
  validateEmail,
  validateNewPassword,
  validateRegistration,
} from '../utils/authValidation.js'

function publicUser(user) {
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    address: user.address,
    role: user.role,
  }
}

function setSessionCookie(response, user) {
  const token = jwt.sign(
    { version: user.auth_token_version },
    jwtSecretKey,
    { subject: String(user.id), expiresIn: jwtExpiresIn },
  )
  response.cookie(authCookieName, token, cookieOptions)
}

export async function register(request, response, next) {
  const validationError = validateRegistration(request.body)
  if (validationError) {
    response.status(400).json({ status: 'error', error: validationError })
    return
  }

  try {
    const name = request.body.name.trim()
    const email = request.body.email.trim().toLowerCase()
    const address = request.body.address.trim()
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      response.status(409).json({ status: 'error', error: 'An account with this email already exists.' })
      return
    }

    const passwordHash = await bcrypt.hash(request.body.password, 12)
    const user = await createNormalUser({ name, email, passwordHash, address })
    setSessionCookie(response, user)
    response.status(201).json({ status: 'ok', user: publicUser(user) })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      response.status(409).json({ status: 'error', error: 'An account with this email already exists.' })
      return
    }
    next(error)
  }
}

export async function login(request, response, next) {
  const { email, password } = request.body || {}
  if (!validateEmail(email) || typeof password !== 'string' || password.length === 0) {
    response.status(400).json({ status: 'error', error: 'Enter a valid email and password.' })
    return
  }

  try {
    const user = await findUserByEmail(email.trim().toLowerCase())
    const passwordMatches = user
      ? await bcrypt.compare(password, user.password_hash)
      : false
    if (!passwordMatches) {
      response.status(401).json({ status: 'error', error: 'Email or password is incorrect.' })
      return
    }

    setSessionCookie(response, user)
    response.json({ status: 'ok', user: publicUser(user) })
  } catch (error) {
    next(error)
  }
}

export async function logout(request, response, next) {
  try {
    const invalidated = await invalidateSessions({
      id: request.authUser.id,
      currentVersion: request.authUser.auth_token_version,
    })
    if (!invalidated) {
      response.status(401).json({ status: 'error', error: 'Session expired. Please log in again.' })
      return
    }
    response.clearCookie(authCookieName, clearCookieOptions)
    response.json({ status: 'ok', message: 'You have been logged out.' })
  } catch (error) {
    next(error)
  }
}

export function getCurrentUser(request, response) {
  response.json({ status: 'ok', user: publicUser(request.authUser) })
}

export async function changePassword(request, response, next) {
  const { currentPassword, newPassword } = request.body || {}
  if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
    response.status(400).json({ status: 'error', error: 'Enter your current password.' })
    return
  }

  const passwordError = validateNewPassword(newPassword)
  if (passwordError) {
    response.status(400).json({ status: 'error', error: passwordError })
    return
  }

  if (currentPassword === newPassword) {
    response.status(400).json({ status: 'error', error: 'Choose a new password different from your current password.' })
    return
  }

  try {
    const user = request.authUser
    const passwordMatches = await bcrypt.compare(currentPassword, user.password_hash)
    if (!passwordMatches) {
      response.status(401).json({ status: 'error', error: 'Current password is incorrect.' })
      return
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)
    const updated = await updatePassword({
      id: user.id,
      currentVersion: user.auth_token_version,
      passwordHash,
    })
    if (!updated) {
      response.status(401).json({ status: 'error', error: 'Session expired. Please log in again.' })
      return
    }

    setSessionCookie(response, {
      ...user,
      auth_token_version: user.auth_token_version + 1,
    })
    response.json({ status: 'ok', message: 'Password updated successfully.' })
  } catch (error) {
    next(error)
  }
}
