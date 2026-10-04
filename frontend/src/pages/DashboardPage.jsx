import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { requestJson } from '../lib/api.js'

function DashboardPage() {
  const { user } = useAuth()
  const [stores, setStores] = useState([])
  const [ratings, setRatings] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    Promise.all([
      requestJson('/api/owner/dashboard'),
      requestJson('/api/owner/ratings'),
    ])
      .then(([dashboardResult, ratingsResult]) => {
        if (!isMounted) return
        setStores(dashboardResult.dashboard.stores)
        setRatings(ratingsResult.ratings)
      })
      .catch((loadError) => {
        if (isMounted) setError(loadError.message)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [user.id])

  const totalRatings = stores.reduce((sum, store) => sum + store.totalRatings, 0)
  const overallAverage = totalRatings === 0
    ? 0
    : stores.reduce((sum, store) => sum + store.averageRating * store.totalRatings, 0) / totalRatings

  return (
    <main className="owner-page">
      <div className="eyebrow"><span /> STORE OWNER</div>
      <div className="owner-page-heading">
        <div>
          <h1>My store<span>.</span></h1>
          <p className="intro">See how customers rate your stores and review their feedback.</p>
        </div>
        <span className="role-badge">Store owner</span>
      </div>

      {loading ? (
        <section className="owner-panel">
          <p className="dashboard-message" role="status">Loading your store dashboard…</p>
        </section>
      ) : error ? (
        <section className="owner-panel">
          <p className="notice" role="alert">{error}</p>
        </section>
      ) : stores.length === 0 ? (
        <section className="owner-panel">
          <h2>Your stores</h2>
          <p className="dashboard-message">No stores are assigned to your account yet.</p>
        </section>
      ) : (
        <>
          <section className="owner-overview" aria-label="Average store rating">
            <div>
              <span className="owner-overview-label">
                {stores.length === 1 ? stores[0].name : 'Average across your stores'}
              </span>
              <p>Based on {totalRatings} {totalRatings === 1 ? 'customer rating' : 'customer ratings'}</p>
            </div>
            <div className="owner-overview-score">
              <span aria-hidden="true">★</span>
              <strong>{overallAverage.toFixed(1)}</strong>
              <small>/ 5</small>
            </div>
          </section>

          <section className="owner-panel" aria-labelledby="owner-stores-title">
            <div className="owner-section-heading">
              <div>
                <h2 id="owner-stores-title">Your stores</h2>
                <p>Ratings are shown separately for each store.</p>
              </div>
            </div>
            <div className="owner-stores">
              {stores.map((store) => (
                <article className="owner-store" key={store.id}>
                  <div>
                    <h3>{store.name}</h3>
                    <p>{store.address}</p>
                  </div>
                  <div className="store-rating-summary">
                    <strong><span aria-hidden="true">★ </span>{store.averageRating.toFixed(1)} / 5</strong>
                    <span>{store.totalRatings} {store.totalRatings === 1 ? 'rating' : 'ratings'}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="owner-panel" aria-labelledby="owner-ratings-title">
            <div className="owner-section-heading">
              <div>
                <h2 id="owner-ratings-title">Users who rated your store</h2>
                <p>Customer ratings for stores assigned to your account.</p>
              </div>
              <span className="owner-rating-count">{ratings.length} {ratings.length === 1 ? 'rating' : 'ratings'}</span>
            </div>
            {ratings.length === 0 ? (
              <p className="dashboard-message">No customers have rated your stores yet.</p>
            ) : (
              <div className="table-wrap">
                <table className="ratings-table owner-ratings-table">
                  <thead>
                    <tr><th>Store</th><th>Name</th><th>Email</th><th>Rating</th><th>Updated</th></tr>
                  </thead>
                  <tbody>
                    {ratings.map((rating) => (
                      <tr key={`${rating.storeId}-${rating.userId}`}>
                        <td>{rating.storeName}</td>
                        <td>{rating.userName}</td>
                        <td>{rating.userEmail}</td>
                        <td><span className="owner-rating-value"><span aria-hidden="true">★ </span>{rating.rating} / 5</span></td>
                        <td>{new Date(rating.updatedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  )
}

export default DashboardPage
