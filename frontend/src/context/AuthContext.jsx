import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { requestJson } from '../lib/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    let isMounted = true

    requestJson('/api/auth/me')
      .then(({ user: currentUser }) => {
        if (isMounted) setUser(currentUser)
      })
      .catch((error) => {
        if (isMounted && error.status !== 401) setAuthError(error.message)
      })
      .finally(() => {
        if (isMounted) setStatus('ready')
      })

    return () => {
      isMounted = false
    }
  }, [])

  async function login(credentials) {
    const result = await requestJson('/api/auth/login', {
      method: 'POST',
      body: credentials,
    })
    setUser(result.user)
    setAuthError('')
    return result.user
  }

  async function register(details) {
    const result = await requestJson('/api/auth/register', {
      method: 'POST',
      body: details,
    })
    setUser(result.user)
    setAuthError('')
    return result.user
  }

  async function logout() {
    try {
      await requestJson('/api/auth/logout', { method: 'POST' })
      setUser(null)
    } catch (error) {
      if (error.status === 401) {
        setUser(null)
        return
      }
      throw error
    }
  }

  const value = useMemo(
    () => ({ user, status, authError, login, register, logout }),
    [user, status, authError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider.')
  return value
}
