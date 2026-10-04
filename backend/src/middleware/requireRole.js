function requireRole(...allowedRoles) {
  return (request, response, next) => {
    if (!request.authUser) {
      response.status(401).json({ status: 'error', error: 'Authentication required.' })
      return
    }

    if (!allowedRoles.includes(request.authUser.role)) {
      response.status(403).json({ status: 'error', error: 'You do not have permission to access this resource.' })
      return
    }

    next()
  }
}

export const requireAdmin = requireRole('system_administrator')
export const requireNormalUser = requireRole('normal_user')
export const requireStoreOwner = requireRole('store_owner')
export default requireRole
