import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './auth/useAuth';

function Home() {
  const { me, isLoggedIn, logout } = useAuth();
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWifi, setFilterWifi] = useState(false);
  const [filterQuiet, setFilterQuiet] = useState(false);
  const CAFES_PER_PAGE = 12;

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    has_good_wifi: false,
    is_quiet: false,
    rating: '',
    cover_image: '',
  });

  const categories = ['discover', 'wifi spots', 'quiet study', 'new places', 'top rated'];
  const [activeTab, setActiveTab] = useState('discover');

  const debounceRef = useRef(null);

  const fetchCafes = useCallback((search, wifi, quiet, pg, reset) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (wifi) params.append('wifi', 'true');
    if (quiet) params.append('quiet', 'true');
    params.append('page', String(pg));
    params.append('limit', String(CAFES_PER_PAGE));

    const url = `/api/cafes?${params.toString()}`;

    fetch(url, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (reset) {
          setCafes(data.cafes);
        } else {
          setCafes((prev) => [...prev, ...data.cafes]);
        }
        setTotal(data.total);
        setPage(pg);
        setLoading(false);
        setLoadingMore(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
        setLoadingMore(false);
      });
  }, [CAFES_PER_PAGE]);

  // Debounce search, instant for filter toggles
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setCafes([]);
      fetchCafes(searchTerm, filterWifi, filterQuiet, 1, true);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, filterWifi, filterQuiet, fetchCafes]);

  const handleLoadMoreCafes = () => {
    fetchCafes(searchTerm, filterWifi, filterQuiet, page + 1, false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.address) {
      alert('Name and address are required!');
      return;
    }

    try {
      const response = await fetch('/api/cafes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          rating: Number(formData.rating),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save, backend returned an error');
      }

      alert('Cafe successfully published!');

      setFormData({
        name: '',
        address: '',
        has_good_wifi: false,
        is_quiet: false,
        rating: '',
        cover_image: '',
      });
      setShowForm(false);
      fetchCafes(searchTerm, filterWifi, filterQuiet, 1, true);
    } catch (err) {
      alert('Error submitting: ' + err.message);
    }
  };

  const initials = me?.username
    ? me.username.slice(0, 2).toUpperCase()
    : me?.email
      ? me.email.slice(0, 2).toUpperCase()
      : 'CD';

  // Split cafes into two columns for balanced layout
  const leftCol = [];
  const rightCol = [];
  cafes.forEach((cafe, i) => {
    if (i % 2 === 0) leftCol.push(cafe);
    else rightCol.push(cafe);
  });

  const renderCard = (cafe) => (
    <Link to={`/cafe/${cafe._id}`} key={cafe._id} className="h-card-link">
      <div className="h-card">
        {cafe.cover_image ? (
          <img className="h-card-img" src={cafe.cover_image} alt={cafe.name} />
        ) : (
          <div className="h-card-placeholder" />
        )}
        <div className="h-card-body">
          <div className="h-card-name">{cafe.name}</div>
          <div className="h-card-addr">{cafe.address}</div>
          <div className="h-card-tags">
            {cafe.has_good_wifi ? <span className="h-tag h-tag--wifi">wifi</span> : null}
            {cafe.is_quiet ? <span className="h-tag h-tag--quiet">quiet</span> : null}
          </div>
          <div className="h-card-footer">
            <span className="h-card-rating">
              {cafe.rating ? `★ ${cafe.rating}` : ''}
            </span>
            <span className="h-card-likes">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              0
            </span>
          </div>
        </div>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <>
        <style>{homeStyles}</style>
        <div className="h-page">
          <p style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>Loading cafes...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{homeStyles}</style>
        <div className="h-page">
          <p style={{ textAlign: 'center', padding: '60px 0', color: '#b00020' }}>
            Something went wrong: {error}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{homeStyles}</style>
      <div className="h-page">
        {/* ── 1. Top Navbar ── */}
        <header className="h-navbar">
          <Link to="/" className="h-logo">
            cafe&nbsp;<span className="h-logo-accent">dog</span>
          </Link>

          <div className="h-nav-right">
            {isLoggedIn ? (
              <>
                <Link to={`/profile/${me?._id}`} className="h-avatar">{initials}</Link>
                <button type="button" className="h-logout-btn" onClick={logout}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="h-auth-link">Log in</Link>
                <Link to="/register" className="h-auth-link h-auth-link--register">Sign up</Link>
              </>
            )}
          </div>
        </header>

        {/* ── 2. Category Tab Bar ── */}
        <nav className="h-tabs">
          {categories.map((cat) => (
            <button
              type="button"
              key={cat}
              className={'h-tab' + (activeTab === cat ? ' h-tab--active' : '')}
              onClick={() => setActiveTab(cat)}
            >
              {cat}
            </button>
          ))}
        </nav>

        {/* ── 3. Filter Row ── */}
        <div className="h-filters">
          <div className="h-filter-search">
            <svg className="h-search-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="h-filter-input"
              placeholder="Search cafes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            type="button"
            className={'h-pill' + (filterWifi ? ' h-pill--active' : '')}
            onClick={() => setFilterWifi(!filterWifi)}
          >
            wifi only
          </button>
          <button
            type="button"
            className={'h-pill' + (filterQuiet ? ' h-pill--active' : '')}
            onClick={() => setFilterQuiet(!filterQuiet)}
          >
            quiet only
          </button>
        </div>

        {/* ── 6. Result Count ── */}
        <p className="h-count">
          Showing {cafes.length} of {total} cafe{total !== 1 ? 's' : ''}
        </p>

        {/* ── 4. Two-column Card Grid ── */}
        <div className="h-grid">
          <div className="h-col">
            {leftCol.map(renderCard)}
          </div>
          <div className="h-col">
            {rightCol.map(renderCard)}
          </div>
        </div>

        {/* Load More */}
        {cafes.length < total ? (
          <div style={{ textAlign: 'center', margin: '24px 0 40px' }}>
            <button
              type="button"
              className="h-load-more"
              onClick={handleLoadMoreCafes}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          </div>
        ) : null}

        {/* ── 5. Floating Action Button ── */}
        <button type="button" className="h-fab" onClick={() => setShowForm(true)} aria-label="Add cafe">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {/* ── Form Modal ── */}
        {showForm ? (
          <div className="h-modal-backdrop" onClick={() => setShowForm(false)}>
            <div className="h-modal" onClick={(e) => e.stopPropagation()}>
              <div className="h-modal-header">
                <h3 className="h-modal-title">Recommend a Cafe</h3>
                <button type="button" className="h-modal-close" onClick={() => setShowForm(false)}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="h-form">
                <input
                  type="text"
                  name="name"
                  className="h-input"
                  placeholder="Cafe name *"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <input
                  type="text"
                  name="address"
                  className="h-input"
                  placeholder="Address *"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
                <input
                  type="number"
                  name="rating"
                  className="h-input"
                  placeholder="Rating (1-5)"
                  value={formData.rating}
                  onChange={handleChange}
                  step="0.1"
                  min="1"
                  max="5"
                />
                <input
                  type="text"
                  name="cover_image"
                  className="h-input"
                  placeholder="Cover image URL"
                  value={formData.cover_image}
                  onChange={handleChange}
                />
                <div className="h-form-checks">
                  <label className="h-check-label">
                    <input
                      type="checkbox"
                      name="has_good_wifi"
                      checked={formData.has_good_wifi}
                      onChange={handleChange}
                    />
                    Fast WiFi
                  </label>
                  <label className="h-check-label">
                    <input
                      type="checkbox"
                      name="is_quiet"
                      checked={formData.is_quiet}
                      onChange={handleChange}
                    />
                    Quiet for studying
                  </label>
                </div>
                <button type="submit" className="h-submit-btn">Publish</button>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

/* ── All styles in a single template literal ── */
const homeStyles = `
  /* 7. Page background — no white container */
  .h-page {
    min-height: 100vh;
    background: #f7f5f2;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    padding-bottom: 80px;
  }

  /* 1. Navbar — transparent, no white box */
  .h-navbar {
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 52px;
    padding: 0 16px;
    background: #f7f5f2;
    border-bottom: 0.5px solid #e5e4e7;
  }
  .h-logo {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.5px;
    color: #222;
    text-decoration: none;
    flex-shrink: 0;
  }
  .h-logo-accent { color: #C97B4B; }
  .h-nav-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }
  .h-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #C97B4B;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    text-decoration: none;
    letter-spacing: 0.5px;
  }
  .h-logout-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
  }
  .h-auth-link {
    font-size: 13px;
    color: #555;
    text-decoration: none;
    font-weight: 500;
  }
  .h-auth-link--register {
    background: #C97B4B;
    color: #fff;
    padding: 5px 14px;
    border-radius: 16px;
    font-size: 12px;
  }

  /* 2. Category Tabs */
  .h-tabs {
    display: flex;
    gap: 0;
    overflow-x: auto;
    background: #f7f5f2;
    padding: 0 16px;
    border-bottom: 0.5px solid #e5e4e7;
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .h-tabs::-webkit-scrollbar { display: none; }
  .h-tab {
    flex-shrink: 0;
    padding: 12px 16px;
    font-size: 13px;
    font-weight: 500;
    color: #999;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    text-transform: capitalize;
    white-space: nowrap;
    transition: color 0.15s, border-color 0.15s;
  }
  .h-tab--active {
    color: #C97B4B;
    border-bottom-color: #C97B4B;
  }

  /* 3. Filter Row */
  .h-filters {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px 0;
    flex-wrap: wrap;
  }
  .h-filter-search {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #fff;
    border: 1px solid #e5e4e7;
    border-radius: 20px;
    padding: 7px 14px;
    flex: 1;
    min-width: 140px;
  }
  .h-filter-input {
    border: none;
    outline: none;
    background: transparent;
    font-size: 13px;
    width: 100%;
    color: #333;
  }
  .h-filter-input::placeholder { color: #bbb; }
  .h-search-icon { flex-shrink: 0; }
  .h-pill {
    padding: 7px 14px;
    border-radius: 20px;
    border: 1px solid #e5e4e7;
    background: #fff;
    font-size: 12px;
    color: #888;
    cursor: pointer;
    white-space: nowrap;
    font-weight: 500;
    transition: all 0.15s;
  }
  .h-pill--active {
    background: #FDF0E8;
    border-color: #C97B4B;
    color: #C97B4B;
  }

  /* 6. Result Count */
  .h-count {
    padding: 8px 16px 0;
    font-size: 13px;
    color: #aaa;
    margin: 0;
  }

  /* 4. Two-column Grid */
  .h-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    padding: 12px 16px 0;
    align-items: start;
  }
  .h-col {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .h-card-link {
    text-decoration: none;
    color: inherit;
    display: block;
  }
  .h-card {
    background: #fff;
    border-radius: 12px;
    border: 0.5px solid #e5e4e7;
    overflow: hidden;
    transition: box-shadow 0.15s;
  }
  .h-card:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  }
  .h-card-img {
    width: 100%;
    height: 160px;
    object-fit: cover;
    display: block;
  }
  .h-card-placeholder {
    width: 100%;
    height: 120px;
    background: linear-gradient(135deg, #f5ebe0, #eddcd2, #e3d5ca);
  }
  .h-card-body {
    padding: 10px 12px 12px;
  }
  .h-card-name {
    font-size: 14px;
    font-weight: 500;
    color: #222;
    margin-bottom: 3px;
    line-height: 1.3;
  }
  .h-card-addr {
    font-size: 11px;
    color: #aaa;
    margin-bottom: 6px;
  }
  .h-card-tags {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }
  .h-tag {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
    letter-spacing: 0.2px;
  }
  .h-tag--wifi {
    background: #FFF3E0;
    color: #E65100;
  }
  .h-tag--quiet {
    background: #E8F5E9;
    color: #2E7D32;
  }
  .h-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .h-card-rating {
    font-size: 12px;
    font-weight: 600;
    color: #C97B4B;
  }
  .h-card-likes {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    color: #ccc;
  }

  /* Load More */
  .h-load-more {
    padding: 10px 32px;
    font-size: 14px;
    font-weight: 500;
    background: #fff;
    border: 1px solid #e5e4e7;
    border-radius: 20px;
    color: #666;
    cursor: pointer;
    transition: all 0.15s;
  }
  .h-load-more:hover {
    border-color: #C97B4B;
    color: #C97B4B;
  }
  .h-load-more:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* 5. Floating Action Button */
  .h-fab {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: #C97B4B;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 14px rgba(201,123,75,0.4);
    transition: transform 0.15s, box-shadow 0.15s;
    z-index: 90;
  }
  .h-fab:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(201,123,75,0.5);
  }

  /* Modal */
  .h-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(0,0,0,0.35);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    animation: h-fade-in 0.15s;
  }
  .h-modal {
    background: #fff;
    width: 100%;
    max-width: 480px;
    border-radius: 16px 16px 0 0;
    padding: 20px 20px 32px;
    animation: h-slide-up 0.25s ease-out;
    max-height: 85vh;
    overflow-y: auto;
  }
  .h-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  .h-modal-title {
    font-size: 17px;
    font-weight: 600;
    color: #222;
    margin: 0;
  }
  .h-modal-close {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    display: flex;
  }
  .h-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .h-input {
    padding: 11px 14px;
    border-radius: 10px;
    border: 1px solid #e5e4e7;
    font-size: 14px;
    outline: none;
    transition: border-color 0.15s;
    background: #fafaf9;
  }
  .h-input:focus {
    border-color: #C97B4B;
    background: #fff;
  }
  .h-form-checks {
    display: flex;
    gap: 20px;
  }
  .h-check-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #555;
    cursor: pointer;
  }
  .h-submit-btn {
    padding: 12px;
    border-radius: 10px;
    border: none;
    background: #C97B4B;
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 4px;
    transition: background 0.15s;
  }
  .h-submit-btn:hover {
    background: #b56a3d;
  }

  @keyframes h-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes h-slide-up {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }

  /* Mobile: 1-column */
  @media (max-width: 480px) {
    .h-grid { grid-template-columns: 1fr; }
  }
`;

export default Home;
