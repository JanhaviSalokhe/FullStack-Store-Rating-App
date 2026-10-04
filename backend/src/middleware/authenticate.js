import jwt from 'jsonwebtoken'
import { authCookieName, jwtSecretKey } from '../config/auth.js'
import { findUserById } from '../models/authModel.js'

async function authenticateUser(request, response, next) {
  const token = request.cookies?.[authCookieName]
  if (!token) {
    response.status(401).json({ status: 'error', error: 'Authentication required.' })
    return
  }

  let payload
  try {
    payload = jwt.verify(token, jwtSecretKey)
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      response.status(401).json({ status: 'error', error: 'Session expired or invalid. Please log in again.' })
      return
    }
    next(error)
    return
  }

  if (
    typeof payload !== 'object' ||
    typeof payload.sub !== 'string' ||
    !Number.isInteger(payload.version)
  ) {
    response.status(401).json({ status: 'error', error: 'Session expired or invalid. Please log in again.' })
    return
  }

  try {
    const user = await findUserById(payload.sub)
    if (!user || user.auth_token_version !== payload.version) {
      response.status(401).json({ status: 'error', error: 'Session expired or invalid. Please log in again.' })
      return
    }

    request.authUser = user
    next()
  } catch (error) {
    next(error)
  }
}

export { authenticateUser }
export default authenticateUser
