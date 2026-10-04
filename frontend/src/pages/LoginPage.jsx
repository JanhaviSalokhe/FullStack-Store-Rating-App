import { useState } from 'react'
import { Link, useLocation, useNavigate } from '../context/RouterContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function destinationFor(user) {
  return user.role === 'normal_user' ? '/stores' : '/dashboard'
}

function LoginPage() {
  const { login, authError } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)

    const form = new FormData(event.currentTarget)
    try {
      const user = await login({
        email: form.get('email'),
        password: form.get('password'),
      })
      const requestedPath = location.state?.from?.pathname
      navigate(requestedPath || destinationFor(user), { replace: true })
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="welcome auth-page">
      <div className="eyebrow"><span /> STORE RATING PLATFORM</div>
      <h1>Good to<br /><span>see you.</span></h1>
      <p className="intro">Sign in to discover stores and share your experience.</p>

      <section className="status-card auth-card" aria-labelledby="login-title">
        <div className="status-heading">
          <div>
            <h2 id="login-title">Welcome back</h2>
            <p>Sign in with your account details.</p>
          </div>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email address
            <input autoComplete="email" maxLength={254} name="email" required type="email" />
          </label>
          <label>
            Password
            <input autoComplete="current-password" name="password" required type="password" />
          </label>
          {(error || authError) && <p className="notice" role="alert">{error || authError}</p>}
          <button className="primary-button" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="switch-mode">
          New to Store Rating? <Link className="inline-link" to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  )
}

export default LoginPage
