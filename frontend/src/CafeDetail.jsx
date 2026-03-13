import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

function CafeDetail() {
    // 1. Grab the dynamic ID from the URL
    const { id } = useParams();

    // 2. Setup state for our single cafe object
    const [cafe, setCafe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 3. Fetch data as soon as the component mounts
    useEffect(() => {
        // Notice how we inject the 'id' variable directly into the URL!
        fetch(`http://localhost:5001/api/cafes/${id}`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error('Failed to fetch cafe details from the server.');
                }
                return res.json();
            })
            .then((data) => {
                setCafe(data); // Save the single object to state
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching detail:", err);
                setError(err.message);
                setLoading(false);
            });
    }, [id]); // This array tells React: "If the ID in the URL ever changes, run this fetch again!"

    // 4. Handle loading and error states gracefully
    if (loading) return <h2>Loading cafe details... ⏳</h2>;
    if (error) return <h2 style={{ color: 'red' }}>Error: {error}</h2>;
    if (!cafe) return <h2>Cafe not found. 🕵️‍♂️</h2>;

    // 5. Render the beautiful detail page
    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>

            {/* Back Button */}
            <Link to="/" style={{ textDecoration: 'none', color: '#007bff', fontSize: '18px', display: 'inline-block', marginBottom: '20px' }}>
                &larr; Back to Home
            </Link>

            {/* Cafe Details Card */}
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <h1 style={{ marginTop: 0, fontSize: '2.5rem' }}>
                    {cafe.name} {cafe.rating && <span style={{ fontSize: '1.5rem', color: '#f39c12' }}>(⭐️ {cafe.rating})</span>}
                </h1>

                <h3 style={{ color: '#555', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                    📍 {cafe.address}
                </h3>

                <div style={{ margin: '20px 0', padding: '15px', backgroundColor: '#f8f9fa', borderLeft: '5px solid #007bff', borderRadius: '4px' }}>
                    <p style={{ margin: '5px 0', fontSize: '1.1rem' }}>
                        {cafe.has_good_wifi ? '✅ Fast WiFi Available' : '❌ No WiFi'}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '1.1rem' }}>
                        {cafe.is_quiet ? '✅ Quiet for studying' : '🗣️ Good for chatting'}
                    </p>
                </div>

                {cafe.cover_image && (
                    <img
                        src={cafe.cover_image}
                        alt={cafe.name}
                        style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '8px', marginTop: '10px' }}
                    />
                )}
            </div>
        </div>
    );
}

export default CafeDetail;