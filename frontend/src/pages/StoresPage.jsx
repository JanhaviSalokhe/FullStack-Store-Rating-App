import { useCallback, useEffect, useState } from 'react'
import { requestJson } from '../lib/api.js'

function StoresPage() {
  const [stores, setStores] = useState([])
  const [search, setSearch] = useState({ name: '', address: '' })
  const [appliedSearch, setAppliedSearch] = useState({ name: '', address: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [activeStore, setActiveStore] = useState(null)
  const [selectedRating, setSelectedRating] = useState('')
  const [savingStoreId, setSavingStoreId] = useState(null)

  const loadStores = useCallback(async (filters, signal) => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams()
    if (filters.name) params.set('name', filters.name)
    if (filters.address) params.set('address', filters.address)
    const query = params.toString()
    const path = query ? `/api/stores/search?${query}` : '/api/stores'

    try {
      const result = await requestJson(path, { signal })
      setStores(result.stores)
    } catch (loadError) {
      if (loadError.name !== 'AbortError') setError(loadError.message)
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadStores({ name: '', address: '' }, controller.signal)
    return () => controller.abort()
  }, [loadStores])

  async function handleSearch(event) {
    event.preventDefault()
    const filters = {
      name: search.name.trim(),
      address: search.address.trim(),
    }
    if (!filters.name && !filters.address) {
      setNotice('')
      setError('Enter a store name or address to search.')
      return
    }

    setNotice('')
    setAppliedSearch(filters)
    await loadStores(filters)
  }

  async function handleClearSearch() {
    const emptySearch = { name: '', address: '' }
    setSearch(emptySearch)
    setAppliedSearch(emptySearch)
    setNotice('')
    await loadStores(emptySearch)
  }

  function beginRating(store) {
    setActiveStore(store)
    setSelectedRating(store.userRating === null ? '' : String(store.userRating))
    setNotice('')
    setError('')
  }

  async function saveRating(event, store) {
    event.preventDefault()
    const ratingValue = Number(selectedRating)
    if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      setError('Choose a rating from 1 to 5.')
      return
    }

    setSavingStoreId(store.id)
    setError('')
    setNotice('')
    try {
      const isUpdate = store.userRatingId !== null
      await requestJson(
        isUpdate ? `/api/ratings/${store.userRatingId}` : '/api/ratings',
        {
          method: isUpdate ? 'PUT' : 'POST',
          body: isUpdate
            ? { rating: ratingValue }
            : { storeId: store.id, rating: ratingValue },
        },
      )
      setActiveStore(null)
      setSelectedRating('')
      setNotice(`Your rating for ${store.name} was ${isUpdate ? 'updated' : 'submitted'}.`)
      await loadStores(appliedSearch)
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSavingStoreId(null)
    }
  }

  return (
    <main className="stores-page">
      <div className="stores-heading">
        <div className="eyebrow"><span /> YOUR LOCAL GUIDE</div>
        <h1>Find a store<br /><span>worth sharing.</span></h1>
        <p className="intro">Explore stores and see what the community thinks. Your rating helps others choose with confidence.</p>
      </div>

      <section className="store-panel" aria-labelledby="stores-title">
        <div className="store-panel-heading">
          <div>
            <h2 id="stores-title">All stores</h2>
            <p>Browse and share your own 1–5 star rating.</p>
          </div>
          {!loading && !error && <span className="store-count">{stores.length} {stores.length === 1 ? 'store' : 'stores'}</span>}
        </div>

        <form className="store-search" onSubmit={handleSearch}>
          <label>
            Store name
            <input
              maxLength={60}
              onChange={(event) => setSearch({ ...search, name: event.target.value })}
              placeholder="e.g. ABC Store"
              value={search.name}
            />
          </label>
          <label>
            Address
            <input
              maxLength={400}
              onChange={(event) => setSearch({ ...search, address: event.target.value })}
              placeholder="e.g. Kolhapur"
              value={search.address}
            />
          </label>
          <div className="search-actions">
            <button className="primary-button" type="submit" disabled={loading}>Search</button>
            <button className="secondary-button" type="button" onClick={handleClearSearch} disabled={loading}>Clear</button>
          </div>
        </form>

        {notice && <p className="success-notice" role="status">{notice}</p>}
        {error && <p className="notice store-notice" role="alert">{error}</p>}
        {loading ? (
          <p className="empty-stores" role="status">Loading stores…</p>
        ) : !error && stores.length === 0 ? (
          <p className="empty-stores">
            {appliedSearch.name || appliedSearch.address
              ? 'No stores match your search.'
              : 'No stores have been added yet.'}
          </p>
        ) : !error ? (
          <div className="store-table-wrap">
            <table className="store-table">
              <thead>
                <tr>
                  <th scope="col">Store</th>
                  <th scope="col">Address</th>
                  <th scope="col">Overall rating</th>
                  <th scope="col">Your rating</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((store) => (
                  <tr key={store.id}>
                    <td data-label="Store">
                      <span className="store-name">{store.name}</span>
                    </td>
                    <td data-label="Address">{store.address}</td>
                    <td data-label="Overall rating">
                      <span className="overall-score">
                        <span aria-hidden="true">★</span>
                        {store.ratingCount > 0 ? store.overallRating.toFixed(1) : '—'}
                      </span>
                      <span className="rating-count">
                        {store.ratingCount > 0
                          ? `${store.ratingCount} ${store.ratingCount === 1 ? 'rating' : 'ratings'}`
                          : 'Not rated'}
                      </span>
                    </td>
                    <td data-label="Your rating">
                      {activeStore?.id === store.id ? (
                        <form className="rating-editor" onSubmit={(event) => saveRating(event, store)}>
                          <label className="visually-hidden" htmlFor={`rating-${store.id}`}>Choose your rating</label>
                          <select
                            autoFocus
                            id={`rating-${store.id}`}
                            onChange={(event) => setSelectedRating(event.target.value)}
                            required
                            value={selectedRating}
                          >
                            <option value="" disabled>Choose a star rating…</option>
                            {[1, 2, 3, 4, 5].map((value) => (
                              <option key={value} value={value}>★ {value} {value === 1 ? 'star' : 'stars'}</option>
                            ))}
                          </select>
                          <button className="rating-save" type="submit" disabled={savingStoreId === store.id}>
                            {savingStoreId === store.id ? 'Saving…' : store.userRatingId === null ? 'Submit' : 'Save'}
                          </button>
                          <button
                            className="rating-cancel"
                            type="button"
                            onClick={() => setActiveStore(null)}
                            disabled={savingStoreId === store.id}
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        store.userRating === null ? '—' : (
                          <span className="my-rating">
                            <span aria-hidden="true">★ </span>{store.userRating} / 5
                          </span>
                        )
                      )}
                    </td>
                    <td data-label="Action">
                      {activeStore?.id !== store.id && (
                        <button className="rate-button" type="button" onClick={() => beginRating(store)}>
                          {store.userRatingId === null ? 'Rate store' : 'Edit rating'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  )
}

export default StoresPage
