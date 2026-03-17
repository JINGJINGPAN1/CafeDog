import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // 🌟 Crucial: Import Link for routing!
import { apiFetch } from './lib/api';
import { useAuth } from './auth/useAuth';
import './Home.css';

function Home() {
  const { me, isLoggedIn, logout } = useAuth();
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterWifi, setFilterWifi] = useState(false);
    const [filterQuiet, setFilterQuiet] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    has_good_wifi: false,
    is_quiet: false,
    rating: '',
    cover_image: '',
  });

  useEffect(() => {
    fetchCafes(searchTerm, filterWifi, filterQuiet);
  }, [searchTerm, filterWifi, filterQuiet]);

    const fetchCafes = (search, wifi, quiet) => {

        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (wifi) params.append('wifi', 'true');
        if (quiet) params.append('quiet', 'true');

        const url = new URL(`http://localhost:5001/api/cafes?${params.toString()}`);

        fetch(url)
            .then((res) => res.json())
            .then((data) => {
                setCafes(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setError(err.message);
                setLoading(false);
            });
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

      alert('🎉 Cafe successfully published!');

      setFormData({
        name: '',
        address: '',
        has_good_wifi: false,
        is_quiet: false,
        rating: '',
        cover_image: '',
      });
      fetchCafes();
    } catch (err) {
      alert('Error submitting: ' + err.message);
    }
  };

  if (loading) return <h2>Fetching data from the backend... 🏃‍♂️</h2>;
  if (error) return <h2 style={{ color: 'red' }}>Oops, something went wrong: {error}</h2>;

  return (
    <div className="page">
      <div className="headerRow">
        <h1>☕️ CaféDog Discovery</h1>
        <div className="authLinks">
          {isLoggedIn ? (
            <>
              <span>Hi, {me?.username || me?.email}</span>
              <button type="button" className="linkButton" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <h3>✨ Recommend a New Cafe</h3>
        <form onSubmit={handleSubmit} className="form">
          <input
            className="input"
            type="text"
            name="name"
            placeholder="Name (Required)"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            className="input"
            type="text"
            name="address"
            placeholder="Address (Required)"
            value={formData.address}
            onChange={handleChange}
            required
          />
          <input
            className="input"
            type="number"
            name="rating"
            placeholder="Rating (1-5)"
            value={formData.rating}
            onChange={handleChange}
            step="0.1"
          />
          <input
            className="input"
            type="text"
            name="cover_image"
            placeholder="Image URL (Optional)"
            value={formData.cover_image}
            onChange={handleChange}
          />

          <div className="row">
            <label>
              <input
                type="checkbox"
                name="has_good_wifi"
                checked={formData.has_good_wifi}
                onChange={handleChange}
              />
              Fast WiFi 📶
            </label>
            <label>
              <input
                type="checkbox"
                name="is_quiet"
                checked={formData.is_quiet}
                onChange={handleChange}
              />
              Quiet for studying 🤫
            </label>
          </div>

                    <button type="submit" style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px', fontSize: '16px' }}>
                        🚀 Publish Cafe
                    </button>
                </form>
            </div>
            <hr />

            {/* search and filter bar */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', margin: '20px 0', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    placeholder="🔍 Search cafés..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', flex: 1, fontSize: '16px' }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={filterWifi}
                        onChange={(e) => setFilterWifi(e.target.checked)}
                    />
                    📶 WiFi only
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={filterQuiet}
                        onChange={(e) => setFilterQuiet(e.target.checked)}
                    />
                    🤫 Quiet only
                </label>
            </div>

            {/* result count hint */}
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '10px' }}>
                {cafes.length} café{cafes.length !== 1 ? 's' : ''} found
            </p>

      <div className="grid">
        {cafes.map((cafe) => (
          /* 🌟 NEW: Wrapped the card in a Link component */
          <Link
            to={`/cafe/${cafe._id}`}
            key={cafe._id}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="cafeCard">
              <h2 style={{ margin: '0 0 10px 0' }}>
                {cafe.name} {cafe.rating && `(⭐️ ${cafe.rating})`}
              </h2>
              <p style={{ margin: '5px 0' }}>📍 {cafe.address}</p>
              <p style={{ margin: '5px 0', color: '#666' }}>
                {cafe.has_good_wifi ? '📶 Fast WiFi' : '📶 No WiFi'} |
                {cafe.is_quiet ? ' 🤫 Quiet to study' : ' 🗣️ Good for chatting'}
              </p>
              {cafe.cover_image && (
                <img src={cafe.cover_image} alt={cafe.name} className="cafeCover" />
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Home; // 🌟 Crucial: Export as Home now!