import { useState } from 'react'
import { Link, useNavigate } from '../context/RouterContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [details, setDetails] = useState({ name: '', email: '', address: '', password: '' })

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      await register(details)
      navigate('/stores', { replace: true })
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="welcome auth-page">
      <div className="eyebrow"><span /> STORE RATING PLATFORM</div>
      <h1>Find your<br /><span>community.</span></h1>
      <p className="intro">Create an account to discover and rate local stores.</p>

      <section className="status-card auth-card" aria-labelledby="register-title">
        <div className="status-heading">
          <div>
            <h2 id="register-title">Create an account</h2>
            <p>New accounts are registered as normal users.</p>
          </div>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Full name
            <input
              autoComplete="name"
              maxLength={60}
              minLength={20}
              onChange={(event) => setDetails({ ...details, name: event.target.value })}
              required
              value={details.name}
            />
          </label>
          <label>
            Email address
            <input
              autoComplete="email"
              maxLength={254}
              onChange={(event) => setDetails({ ...details, email: event.target.value })}
              required
              type="email"
              value={details.email}
            />
          </label>
          <label>
            Address
            <textarea
              autoComplete="street-address"
              maxLength={400}
              onChange={(event) => setDetails({ ...details, address: event.target.value })}
              required
              rows={2}
              value={details.address}
            />
          </label>
          <label>
            Password
            <input
              autoComplete="new-password"
              maxLength={16}
              minLength={8}
              onChange={(event) => setDetails({ ...details, password: event.target.value })}
              pattern="(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}"
              required
              title="Use 8–16 characters, including an uppercase letter and a special character."
              type="password"
              value={details.password}
            />
          </label>
          <p className="password-hint">Name: 20–60 characters. Password: 8–16 characters, including uppercase and special characters.</p>
          {error && <p className="notice" role="alert">{error}</p>}
          <button className="primary-button" type="submit" disabled={busy}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="switch-mode">
          Already have an account? <Link className="inline-link" to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  )
}

export default RegisterPage
