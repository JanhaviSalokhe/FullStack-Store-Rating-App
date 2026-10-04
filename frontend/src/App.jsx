import { Link, Navigate, useLocation } from './context/RouterContext.jsx'
import AppLayout from './components/AppLayout.jsx'
import { ProtectedRoute, PublicOnlyRoute } from './components/RouteGuards.jsx'
import { useAuth } from './context/AuthContext.jsx'
import ChangePasswordPage from './pages/ChangePasswordPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import {
  AdminDashboardPage,
  AdminStoresPage,
  AdminUserDetailsPage,
  AdminUsersPage,
  AddAdminStorePage,
  AddAdminUserPage,
} from './pages/AdminPages.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import StoresPage from './pages/StoresPage.jsx'

function HomeRedirect() {
  const { user, status } = useAuth()
  if (status === 'loading') return <p className="loading-message" role="status">Checking your session…</p>
  const destination = user?.role === 'normal_user'
    ? '/stores'
    : user?.role === 'system_administrator'
      ? '/admin'
      : user
        ? '/dashboard'
        : '/login'
  return <Navigate to={destination} replace />
}

function NotFound() {
  return (
    <main className="welcome auth-page">
      <div className="eyebrow"><span /> STORE RATING PLATFORM</div>
      <h1>Page not<br /><span>found.</span></h1>
      <p className="intro">That page does not exist or may have moved.</p>
      <Link className="primary-button not-found-link" to="/">Go to your home page</Link>
    </main>
  )
}

function App() {
  const { pathname } = useLocation()
  let content

  if (pathname === '/login') {
    content = <PublicOnlyRoute><LoginPage /></PublicOnlyRoute>
  } else if (pathname === '/register') {
    content = <PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>
  } else if (pathname === '/stores') {
    content = <ProtectedRoute roles={['normal_user']}><StoresPage /></ProtectedRoute>
  } else if (pathname === '/change-password') {
    content = <ProtectedRoute><ChangePasswordPage /></ProtectedRoute>
  } else if (pathname === '/dashboard') {
    content = <ProtectedRoute roles={['store_owner']}><DashboardPage /></ProtectedRoute>
  } else if (pathname === '/admin') {
    content = <ProtectedRoute roles={['system_administrator']}><AdminDashboardPage /></ProtectedRoute>
  } else if (pathname === '/admin/users') {
    content = <ProtectedRoute roles={['system_administrator']}><AdminUsersPage /></ProtectedRoute>
  } else if (pathname === '/admin/users/add') {
    content = <ProtectedRoute roles={['system_administrator']}><AddAdminUserPage /></ProtectedRoute>
  } else if (/^\/admin\/users\/[^/]+$/.test(pathname)) {
    content = <ProtectedRoute roles={['system_administrator']}><AdminUserDetailsPage id={pathname.split('/').at(-1)} /></ProtectedRoute>
  } else if (pathname === '/admin/stores') {
    content = <ProtectedRoute roles={['system_administrator']}><AdminStoresPage /></ProtectedRoute>
  } else if (pathname === '/admin/stores/add') {
    content = <ProtectedRoute roles={['system_administrator']}><AddAdminStorePage /></ProtectedRoute>
  } else if (pathname === '/') {
    content = <HomeRedirect />
  } else {
    content = <NotFound />
  }

  return <AppLayout>{content}</AppLayout>
}

export default App
