import { useState } from 'react'
import { Link } from '../context/RouterContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { requestJson } from '../lib/api.js'

function ChangePasswordPage() {
  const { user } = useAuth()
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      const result = await requestJson('/api/auth/password', {
        method: 'PATCH',
        body: passwords,
      })
      setPasswords({ currentPassword: '', newPassword: '' })
      setNotice(result.message)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="welcome auth-page">
      <div className="eyebrow"><span /> ACCOUNT SECURITY</div>
      <h1>Keep your<br /><span>account safe.</span></h1>
      <p className="intro">Change your password anytime. Your other active sessions will be signed out.</p>

      <section className="status-card auth-card" aria-labelledby="password-title">
        <div className="status-heading">
          <div>
            <h2 id="password-title">Change password</h2>
            <p>Enter your current password and choose a new one.</p>
          </div>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Current password
            <input
              autoComplete="current-password"
              onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })}
              required
              type="password"
              value={passwords.currentPassword}
            />
          </label>
          <label>
            New password
            <input
              autoComplete="new-password"
              maxLength={16}
              minLength={8}
              onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })}
              pattern="(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}"
              required
              title="Use 8–16 characters, including an uppercase letter and a special character."
              type="password"
              value={passwords.newPassword}
            />
          </label>
          <p className="password-hint">Use 8–16 characters, including an uppercase letter and a special character.</p>
          {error && <p className="notice" role="alert">{error}</p>}
          {notice && <p className="success-notice" role="status">{notice}</p>}
          <button className="primary-button" type="submit" disabled={busy}>
            {busy ? 'Updating…' : 'Update password'}
          </button>
        </form>
        <p className="switch-mode">
          <Link className="inline-link" to={user.role === 'normal_user' ? '/stores' : '/dashboard'}>
            {user.role === 'normal_user' ? 'Back to stores' : 'Back to dashboard'}
          </Link>
        </p>
      </section>
    </main>
  )
}

export default ChangePasswordPage
