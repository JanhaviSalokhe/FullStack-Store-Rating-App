import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from '../context/RouterContext.jsx'
import { requestJson } from '../lib/api.js'

const roleLabels = {
  normal_user: 'Normal User',
  system_administrator: 'System Administrator',
  store_owner: 'Store Owner',
}

function AdminPage({ eyebrow = 'ADMINISTRATION', title, description, action, children }) {
  return (
    <main className="admin-page">
      <div className="admin-page-heading">
        <div>
          <div className="eyebrow"><span /> {eyebrow}</div>
          <h1>{title}</h1>
          <p className="intro">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </main>
  )
}

function MetricCard({ label, value }) {
  return (
    <article className="admin-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function DataTable({
  columns,
  rows,
  emptyMessage,
  rowKey,
  sortBy,
  order,
  onSort,
}) {
  return rows.length === 0 ? (
    <p className="admin-empty">{emptyMessage}</p>
  ) : (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>{columns.map((column) => {
            const sortKey = column.sortKey
            const isSorted = sortKey && sortKey === sortBy
            return (
              <th
                key={column.key}
                scope="col"
                aria-sort={sortKey ? isSorted ? order === 'asc' ? 'ascending' : 'descending' : 'none' : undefined}
              >
                {sortKey ? (
                  <button className="admin-sort-button" type="button" onClick={() => onSort(sortKey)}>
                    {column.label}
                    <span aria-hidden="true">{isSorted ? order === 'asc' ? ' ↑' : ' ↓' : ' ↕'}</span>
                  </button>
                ) : column.label}
              </th>
            )
          })}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td key={column.key} data-label={column.label}>
                  {column.render ? column.render(row) : row[column.key] || '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ErrorMessage({ children }) {
  return children ? <p className="notice admin-notice" role="alert">{children}</p> : null
}

export function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null)
  const [users, setUsers] = useState([])
  const [stores, setStores] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    async function loadDashboard() {
      try {
        const [dashboardResult, usersResult, storesResult] = await Promise.all([
          requestJson('/api/admin/dashboard'),
          requestJson('/api/admin/users?sortBy=name&order=asc'),
          requestJson('/api/admin/stores?sortBy=name&order=asc'),
        ])
        if (!isMounted) return
        setDashboard(dashboardResult.dashboard)
        setUsers(usersResult.users.slice(0, 5))
        setStores(storesResult.stores.slice(0, 5))
      } catch (loadError) {
        if (isMounted) setError(loadError.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadDashboard()
    return () => { isMounted = false }
  }, [])

  return (
    <AdminPage
      title="Admin dashboard"
      description="A clear overview of your users, registered stores, and submitted ratings."
      action={<Link className="primary-button admin-action" to="/admin/users/add">Add user</Link>}
    >
      <ErrorMessage>{error}</ErrorMessage>
      {loading ? (
        <section className="admin-section"><p className="admin-empty" role="status">Loading dashboard…</p></section>
      ) : !error && dashboard ? (
        <>
          <section className="admin-metrics" aria-label="Platform totals">
            <MetricCard label="Total users" value={dashboard.totalUsers} />
            <MetricCard label="Total stores" value={dashboard.totalStores} />
            <MetricCard label="Ratings submitted" value={dashboard.totalRatings} />
          </section>

          <AdminPreviewSection
            title="Users"
            description="Recently added platform accounts."
            actionLabel="View all users"
            actionTo="/admin/users"
          >
            <DataTable
              rowKey={(row) => row.id}
              rows={users}
              emptyMessage="No users have been added yet."
              columns={[
                { key: 'name', label: 'Name', render: (row) => <Link className="admin-table-link" to={`/admin/users/${row.id}`}>{row.name}</Link> },
                { key: 'email', label: 'Email' },
                { key: 'address', label: 'Address' },
                { key: 'role', label: 'Role', render: (row) => roleLabels[row.role] },
              ]}
            />
          </AdminPreviewSection>

          <AdminPreviewSection
            title="Stores"
            description="Registered stores and their community ratings."
            actionLabel="View all stores"
            actionTo="/admin/stores"
          >
            <DataTable
              rowKey={(row) => row.id}
              rows={stores}
              emptyMessage="No stores have been added yet."
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'email', label: 'Email' },
                { key: 'address', label: 'Address' },
                { key: 'averageRating', label: 'Rating', render: (row) => row.ratingCount > 0 ? `${row.averageRating.toFixed(1)} / 5` : 'Not rated' },
              ]}
            />
          </AdminPreviewSection>
        </>
      ) : null}
    </AdminPage>
  )
}

function AdminPreviewSection({ title, description, actionLabel, actionTo, children }) {
  return (
    <section className="admin-section">
      <div className="admin-section-heading">
        <div><h2>{title}</h2><p>{description}</p></div>
        <Link className="admin-secondary-link" to={actionTo}>{actionLabel}<span aria-hidden="true"> →</span></Link>
      </div>
      {children}
    </section>
  )
}

const userSortOptions = [
  ['name', 'Name'],
  ['email', 'Email'],
  ['address', 'Address'],
  ['role', 'Role'],
]

const storeSortOptions = [
  ['name', 'Name'],
  ['email', 'Email'],
  ['address', 'Address'],
  ['rating', 'Rating'],
]

function useAdminListing(resource) {
  const [filters, setFilters] = useState({ name: '', email: '', address: '', role: '' })
  const [sortBy, setSortBy] = useState('name')
  const [order, setOrder] = useState('asc')
  const [result, setResult] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (nextFilters, nextSortBy, nextOrder, signal) => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(nextFilters)) {
      if (value.trim()) params.set(key, value.trim())
    }
    params.set('sortBy', nextSortBy)
    params.set('order', nextOrder)

    try {
      const response = await requestJson(`/api/admin/${resource}?${params}`, { signal })
      const rows = resource === 'users' ? response.users : response.stores
      setResult(rows)
      setTotal(response.total)
    } catch (loadError) {
      if (!signal.aborted) setError(loadError.message)
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }, [resource])

  useEffect(() => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => {
      load(filters, sortBy, order, controller.signal)
    }, 250)
    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [load, filters, sortBy, order])

  function handleFilterChange(event) {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function setSort(nextSortBy) {
    if (nextSortBy === sortBy) {
      setOrder((current) => current === 'asc' ? 'desc' : 'asc')
      return
    }
    chooseSort(nextSortBy)
  }

  function chooseSort(nextSortBy) {
    setSortBy(nextSortBy)
    setOrder('asc')
  }

  function handleSortChange(event) {
    chooseSort(event.target.value)
  }

  function toggleOrder() {
    setOrder((current) => current === 'asc' ? 'desc' : 'asc')
  }

  function clearFilters() {
    setFilters({ name: '', email: '', address: '', role: '' })
  }

  return {
    filters,
    result,
    total,
    loading,
    error,
    sortBy,
    order,
    handleFilterChange,
    handleSortChange,
    toggleOrder,
    setSort,
    clearFilters,
  }
}

function ListingToolbar({ listing, sortOptions, includeRole = false }) {
  return (
    <div className="admin-listing-toolbar">
      <div className="admin-filters">
        <label>
          Name
          <input name="name" maxLength={60} onChange={listing.handleFilterChange} placeholder="Filter by name" value={listing.filters.name} />
        </label>
        <label>
          Email
          <input name="email" maxLength={254} onChange={listing.handleFilterChange} placeholder="Filter by email" value={listing.filters.email} />
        </label>
        <label>
          Address
          <input name="address" maxLength={400} onChange={listing.handleFilterChange} placeholder="Filter by address" value={listing.filters.address} />
        </label>
        {includeRole && (
          <label>
            Role
            <select name="role" onChange={listing.handleFilterChange} value={listing.filters.role}>
              <option value="">All roles</option>
              <option value="normal_user">Normal User</option>
              <option value="system_administrator">System Administrator</option>
              <option value="store_owner">Store Owner</option>
            </select>
          </label>
        )}
      </div>
      <div className="admin-sort-controls">
        <span className="admin-sort-hint">Select a table heading to sort by {sortOptions.map(([, label]) => label).join(', ')}.</span>
        <div className="admin-mobile-sort-controls">
          <label>
            Sort by
            <select onChange={listing.handleSortChange} value={listing.sortBy}>
              {sortOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <button className="secondary-button" type="button" onClick={listing.toggleOrder} aria-label={`Sort ${listing.order === 'asc' ? 'descending' : 'ascending'}`}>
            {listing.order === 'asc' ? 'Ascending ↑' : 'Descending ↓'}
          </button>
        </div>
        <button className="secondary-button" type="button" onClick={listing.clearFilters}>Clear filters</button>
      </div>
    </div>
  )
}

export function AdminUsersPage() {
  const listing = useAdminListing('users')

  return (
    <AdminPage
      title="Users"
      description="Browse platform accounts, filter the directory, and review account details."
      action={<Link className="primary-button admin-action" to="/admin/users/add">Add user</Link>}
    >
      <section className="admin-section admin-list-section">
        <div className="admin-section-heading">
          <div><h2>User directory</h2><p>{listing.total} {listing.total === 1 ? 'user' : 'users'} found</p></div>
        </div>
        <ListingToolbar listing={listing} sortOptions={userSortOptions} includeRole />
        <ErrorMessage>{listing.error}</ErrorMessage>
        {listing.loading ? <p className="admin-empty" role="status">Loading users…</p> : !listing.error ? (
          <DataTable
            rowKey={(row) => row.id}
            rows={listing.result}
            emptyMessage="No users match these filters."
            sortBy={listing.sortBy}
            order={listing.order}
            onSort={listing.setSort}
            columns={[
              { key: 'name', label: 'Name', sortKey: 'name', render: (row) => <Link className="admin-table-link" to={`/admin/users/${row.id}`}>{row.name}</Link> },
              { key: 'email', label: 'Email', sortKey: 'email' },
              { key: 'address', label: 'Address', sortKey: 'address' },
              { key: 'role', label: 'Role', sortKey: 'role', render: (row) => roleLabels[row.role] },
              { key: 'ownerRating', label: 'Owner rating', render: (row) => row.role === 'store_owner' ? row.ownerRating === null ? 'Not rated' : `${row.ownerRating.toFixed(1)} / 5` : '—' },
              { key: 'details', label: 'Details', render: (row) => <Link className="admin-secondary-link" to={`/admin/users/${row.id}`}>View details</Link> },
            ]}
          />
        ) : null}
      </section>
    </AdminPage>
  )
}

export function AdminStoresPage() {
  const listing = useAdminListing('stores')

  return (
    <AdminPage
      title="Stores"
      description="Review registered stores, their contact information, and community ratings."
      action={<Link className="primary-button admin-action" to="/admin/stores/add">Add store</Link>}
    >
      <section className="admin-section admin-list-section">
        <div className="admin-section-heading">
          <div><h2>Store directory</h2><p>{listing.total} {listing.total === 1 ? 'store' : 'stores'} found</p></div>
        </div>
        <ListingToolbar listing={listing} sortOptions={storeSortOptions} />
        <ErrorMessage>{listing.error}</ErrorMessage>
        {listing.loading ? <p className="admin-empty" role="status">Loading stores…</p> : !listing.error ? (
          <DataTable
            rowKey={(row) => row.id}
            rows={listing.result}
            emptyMessage="No stores match these filters."
            sortBy={listing.sortBy}
            order={listing.order}
            onSort={listing.setSort}
            columns={[
              { key: 'name', label: 'Name', sortKey: 'name' },
              { key: 'email', label: 'Email', sortKey: 'email' },
              { key: 'address', label: 'Address', sortKey: 'address' },
              { key: 'averageRating', label: 'Rating', sortKey: 'rating', render: (row) => row.ratingCount > 0 ? `${row.averageRating.toFixed(1)} / 5` : 'Not rated' },
              { key: 'ratingCount', label: 'Ratings', render: (row) => row.ratingCount },
            ]}
          />
        ) : null}
      </section>
    </AdminPage>
  )
}

export function AddAdminUserPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', address: '', password: '', role: 'normal_user',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const { user } = await requestJson('/api/admin/users', { method: 'POST', body: form })
      navigate(`/admin/users/${user.id}`)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminPage title="Add user" description="Create a normal-user or system-administrator account.">
      <section className="admin-section admin-form-section">
        <div className="admin-section-heading"><div><h2>User information</h2><p>All fields are required.</p></div></div>
        <form className="admin-form" onSubmit={handleSubmit}>
          <label>Full name<input name="name" maxLength={60} minLength={20} onChange={updateField} required value={form.name} /></label>
          <label>Email address<input name="email" autoComplete="email" maxLength={254} onChange={updateField} required type="email" value={form.email} /></label>
          <label>Address<textarea name="address" maxLength={400} onChange={updateField} required rows={3} value={form.address} /></label>
          <label>
            Role
            <select name="role" onChange={updateField} value={form.role}>
              <option value="normal_user">Normal User</option>
              <option value="system_administrator">System Administrator</option>
            </select>
          </label>
          <label>
            Temporary password
            <input name="password" autoComplete="new-password" maxLength={16} minLength={8} onChange={updateField} pattern="(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}" required title="Use 8–16 characters, including an uppercase letter and a special character." type="password" value={form.password} />
          </label>
          <p className="password-hint">Password must be 8–16 characters and include an uppercase letter and a special character.</p>
          <ErrorMessage>{error}</ErrorMessage>
          <div className="admin-form-actions">
            <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create user'}</button>
            <Link className="secondary-button admin-cancel" to="/admin/users">Cancel</Link>
          </div>
        </form>
      </section>
    </AdminPage>
  )
}

export function AddAdminStorePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', address: '', ownerId: '' })
  const [owners, setOwners] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let isMounted = true
    requestJson('/api/admin/users?role=store_owner&sortBy=name&order=asc')
      .then(({ users }) => { if (isMounted) setOwners(users) })
      .catch((loadError) => { if (isMounted) setError(loadError.message) })
    return () => { isMounted = false }
  }, [])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const body = { name: form.name, email: form.email, address: form.address }
    if (form.ownerId) body.ownerId = form.ownerId
    try {
      await requestJson('/api/admin/stores', { method: 'POST', body })
      navigate('/admin/stores')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminPage title="Add store" description="Register a store and optionally assign its owner.">
      <section className="admin-section admin-form-section">
        <div className="admin-section-heading"><div><h2>Store information</h2><p>Store name, email, and address are required.</p></div></div>
        <form className="admin-form" onSubmit={handleSubmit}>
          <label>Store name<input name="name" maxLength={60} minLength={20} onChange={updateField} required value={form.name} /></label>
          <label>Store email<input name="email" autoComplete="email" maxLength={254} onChange={updateField} required type="email" value={form.email} /></label>
          <label>Address<textarea name="address" maxLength={400} onChange={updateField} required rows={3} value={form.address} /></label>
          <label>
            Store owner
            <select name="ownerId" onChange={updateField} value={form.ownerId}>
              <option value="">No owner assigned</option>
              {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name} · {owner.email}</option>)}
            </select>
          </label>
          <ErrorMessage>{error}</ErrorMessage>
          <div className="admin-form-actions">
            <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create store'}</button>
            <Link className="secondary-button admin-cancel" to="/admin/stores">Cancel</Link>
          </div>
        </form>
      </section>
    </AdminPage>
  )
}

export function AdminUserDetailsPage({ id }) {
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    requestJson(`/api/admin/users/${encodeURIComponent(id)}`)
      .then(({ user: result }) => { if (isMounted) setUser(result) })
      .catch((loadError) => { if (isMounted) setError(loadError.message) })
      .finally(() => { if (isMounted) setLoading(false) })
    return () => { isMounted = false }
  }, [id])

  return (
    <AdminPage
      title="User details"
      description="Account information and, for store owners, their store rating summary."
      action={<Link className="secondary-button admin-cancel" to="/admin/users">Back to users</Link>}
    >
      <section className="admin-section">
        {loading ? <p className="admin-empty" role="status">Loading user details…</p> : error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : user ? (
          <>
            <div className="user-detail-heading">
              <div><span className="eyebrow"><span /> ACCOUNT PROFILE</span><h2>{user.name}</h2></div>
              <span className="admin-role-badge">{roleLabels[user.role]}</span>
            </div>
            <dl className="admin-details-list">
              <DetailRow label="Email" value={user.email} />
              <DetailRow label="Address" value={user.address} />
              <DetailRow label="Role" value={roleLabels[user.role]} />
              {user.role === 'store_owner' && (
                <DetailRow label="Overall owner rating" value={user.ownerRating === null ? 'Not rated' : `${user.ownerRating.toFixed(1)} / 5`} />
              )}
            </dl>
            {user.role === 'store_owner' && (
              <section className="owner-detail-stores">
                <div className="admin-section-heading"><div><h2>Owned stores</h2><p>Store-level community ratings.</p></div></div>
                <DataTable
                  rowKey={(store) => store.id}
                  rows={user.stores}
                  emptyMessage="This owner has no assigned stores."
                  columns={[
                    { key: 'name', label: 'Store' },
                    { key: 'email', label: 'Email' },
                    { key: 'address', label: 'Address' },
                    { key: 'averageRating', label: 'Rating', render: (store) => store.ratingCount > 0 ? `${store.averageRating.toFixed(1)} / 5` : 'Not rated' },
                    { key: 'ratingCount', label: 'Ratings', render: (store) => store.ratingCount },
                  ]}
                />
              </section>
            )}
          </>
        ) : null}
      </section>
    </AdminPage>
  )
}

function DetailRow({ label, value }) {
  return <div className="admin-detail-row"><dt>{label}</dt><dd>{value}</dd></div>
}
