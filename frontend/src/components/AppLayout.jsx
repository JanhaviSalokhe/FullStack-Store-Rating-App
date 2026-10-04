import { useState } from 'react'
import { Link, NavLink, useNavigate } from '../context/RouterContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function homePathFor(user) {
  if (!user) return '/'
  if (user.role === 'normal_user') return '/stores'
  return user.role === 'system_administrator' ? '/admin' : '/dashboard'
}

function AppLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState('')

  const navigationItems = user?.role === 'system_administrator'
    ? [
      { to: '/admin', label: 'Dashboard' },
      { to: '/admin/users', label: 'Users' },
      { to: '/admin/stores', label: 'Stores' },
      { to: '/change-password', label: 'Password' },
    ]
    : user?.role === 'store_owner'
      ? [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/change-password', label: 'Password' },
      ]
      : user
        ? [
          { to: '/stores', label: 'Stores' },
          { to: '/change-password', label: 'Password' },
        ]
        : []

  async function handleLogout() {
    setLogoutError('')
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (error) {
      setLogoutError(error.message)
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <Link className="brand" to={homePathFor(user)} aria-label="Store Rating home">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>Store Rating</span>
        </Link>
        {user ? (
          <div className="topbar-account">
            <span className="topbar-user">
              <span className="user-avatar" aria-hidden="true">{user.name.trim().charAt(0).toUpperCase()}</span>
              <span className="nav-user">{user.name}</span>
            </span>
            <button className="text-button" type="button" onClick={handleLogout}>Log out</button>
          </div>
        ) : (
          <span className="stage-label">STORE RATING PLATFORM</span>
        )}
      </header>
      {logoutError && <p className="global-notice" role="alert">{logoutError}</p>}
      {user ? (
        <div className="app-workspace">
          <aside className="sidebar">
            <span className="sidebar-label">WORKSPACE</span>
            <nav className="sidebar-nav" aria-label="Workspace navigation">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.to}
                  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                  to={item.to}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>
          <div className="workspace-main">{children}</div>
        </div>
      ) : children}
    </div>
  )
}

export default AppLayout
