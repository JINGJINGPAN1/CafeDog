import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './auth/useAuth';
import './Home.css';

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
      <div className="h-page">
        <p className="h-status">Loading cafes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-page">
        <p className="h-status h-status--error">
          Something went wrong: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="h-page">
      {/* 1. Top Navbar */}
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

      {/* 2. Category Tab Bar */}
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

      {/* 3. Filter Row */}
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

      {/* 6. Result Count */}
      <p className="h-count">
        Showing {cafes.length} of {total} cafe{total !== 1 ? 's' : ''}
      </p>

      {/* 4. Two-column Card Grid */}
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
        <div className="h-load-more-wrap">
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

      {/* 5. Floating Action Button */}
      <button type="button" className="h-fab" onClick={() => setShowForm(true)} aria-label="Add cafe">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Form Modal */}
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
  );
}

export default Home;
