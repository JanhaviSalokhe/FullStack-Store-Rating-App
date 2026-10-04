import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

const RouterContext = createContext(null)

function currentLocation() {
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/'
  return {
    pathname,
    state: window.history.state?.routerState || null,
  }
}

export function RouterProvider({ children }) {
  const [location, setLocation] = useState(currentLocation)

  useEffect(() => {
    function updateLocation() {
      setLocation(currentLocation())
    }
    window.addEventListener('popstate', updateLocation)
    return () => window.removeEventListener('popstate', updateLocation)
  }, [])

  const navigate = useCallback((to, options = {}) => {
    if (typeof to === 'number') {
      window.history.go(to)
      return
    }

    if (
      typeof to !== 'string' ||
      !to.startsWith('/') ||
      to.startsWith('//') ||
      to.includes('\\')
    ) {
      throw new Error('Navigation must use an internal application path.')
    }

    const target = new URL(to, window.location.origin)
    if (target.origin !== window.location.origin) {
      throw new Error('Navigation must stay within this application.')
    }

    const method = options.replace ? 'replaceState' : 'pushState'
    window.history[method]({ routerState: options.state || null }, '', target.pathname)
    setLocation(currentLocation())
  }, [])

  const value = useMemo(
    () => ({ location, navigate }),
    [location, navigate],
  )

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

export function useLocation() {
  const value = useContext(RouterContext)
  if (!value) throw new Error('useLocation must be used inside RouterProvider.')
  return value.location
}

export function useNavigate() {
  const value = useContext(RouterContext)
  if (!value) throw new Error('useNavigate must be used inside RouterProvider.')
  return value.navigate
}

export function Link({ to, children, className, ...props }) {
  const navigate = useNavigate()

  function handleClick(event) {
    props.onClick?.(event)
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }
    event.preventDefault()
    navigate(to)
  }

  return (
    <a {...props} className={className} href={to} onClick={handleClick}>
      {children}
    </a>
  )
}

export function NavLink({ to, children, className, ...props }) {
  const { pathname } = useLocation()
  const activeClass = typeof className === 'function'
    ? className({ isActive: pathname === to })
    : className

  return <Link {...props} className={activeClass} to={to}>{children}</Link>
}

export function Navigate({ to, replace = false, state }) {
  const navigate = useNavigate()

  useEffect(() => {
    const currentPath = window.location.pathname.replace(/\/+$/, '') || '/'
    if (currentPath !== to) navigate(to, { replace, state })
  }, [navigate, replace, state, to])

  return null
}
