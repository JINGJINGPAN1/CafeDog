import { useState, useEffect } from 'react';

function App() {
  // 1. declare the state variables
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

 // 2. fetch the data from the backend
  useEffect(() => {
    // use the native fetch API
    fetch('http://localhost:5001/api/cafes')
      .then((response) => {
        // the problem: even if the backend returns an error (like 404, 500), fetch will not throw an exception, you must manually check response.ok
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setCafes(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching cafes:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // 3. render the UI
  if (loading) return <h2>The delivery guy is on the way to fetch the data from the backend... 🏃‍♂️</h2>;
  if (error) return <h2 style={{color: 'red'}}>Oops, something went wrong: {error}</h2>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>☕️ CaféDog Discovery</h1>
      
      {/* 4. render the cafe cards */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {cafes.map((cafe) => (
          <div key={cafe._id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
            <h2>{cafe.name} {cafe.rating && `(⭐️ ${cafe.rating})`}</h2>
            <p>📍 {cafe.address}</p>
            <p>
              {cafe.has_good_wifi ? '📶 WiFi is fast' : '📶 No WiFi'} | 
              {cafe.is_quiet ? ' 🤫 Suitable for studying' : ' 🗣️ Suitable for chatting'}
            </p>
            {/* show the image */}
            {cafe.cover_image && (
              <img 
                src={cafe.cover_image} 
                alt={cafe.name} 
                style={{ width: '100%', maxWidth: '400px', borderRadius: '4px', marginTop: '10px' }} 
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;