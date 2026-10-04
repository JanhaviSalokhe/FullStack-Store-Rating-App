import 'dotenv/config'

const jwtSecret = process.env.JWT_SECRET
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('Set JWT_SECRET to a random secret of at least 32 characters in backend/.env.')
}

export const authCookieName = 'store_rating_token'
export const jwtExpiresIn = '1h'
export const jwtSecretKey = jwtSecret
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 1000,
}
export const clearCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
}
