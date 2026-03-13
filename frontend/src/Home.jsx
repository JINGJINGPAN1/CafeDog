import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // 🌟 Crucial: Import Link for routing!

function Home() {
    const [cafes, setCafes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        has_good_wifi: false,
        is_quiet: false,
        rating: '',
        cover_image: ''
    });

    useEffect(() => {
        fetchCafes();
    }, []);

    const fetchCafes = () => {
        fetch('http://localhost:5001/api/cafes')
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
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.address) {
            alert("Name and address are required!");
            return;
        }

        try {
            const response = await fetch('http://localhost:5001/api/cafes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    rating: Number(formData.rating)
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save, backend returned an error');
            }

            alert("🎉 Cafe successfully published!");

            setFormData({ name: '', address: '', has_good_wifi: false, is_quiet: false, rating: '', cover_image: '' });
            fetchCafes();

        } catch (err) {
            alert("Error submitting: " + err.message);
        }
    };

    if (loading) return <h2>Fetching data from the backend... 🏃‍♂️</h2>;
    if (error) return <h2 style={{ color: 'red' }}>Oops, something went wrong: {error}</h2>;

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
            <h1>☕️ CaféDog Discovery</h1>

            <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
                <h3>✨ Recommend a New Cafe</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                    <input type="text" name="name" placeholder="Name (Required)" value={formData.name} onChange={handleChange} required style={{ padding: '8px' }} />
                    <input type="text" name="address" placeholder="Address (Required)" value={formData.address} onChange={handleChange} required style={{ padding: '8px' }} />
                    <input type="number" name="rating" placeholder="Rating (1-5)" value={formData.rating} onChange={handleChange} step="0.1" style={{ padding: '8px' }} />
                    <input type="text" name="cover_image" placeholder="Image URL (Optional)" value={formData.cover_image} onChange={handleChange} style={{ padding: '8px' }} />

                    <div style={{ display: 'flex', gap: '20px' }}>
                        <label>
                            <input type="checkbox" name="has_good_wifi" checked={formData.has_good_wifi} onChange={handleChange} />
                            Fast WiFi 📶
                        </label>
                        <label>
                            <input type="checkbox" name="is_quiet" checked={formData.is_quiet} onChange={handleChange} />
                            Quiet for studying 🤫
                        </label>
                    </div>

                    <button type="submit" style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px', fontSize: '16px' }}>
                        🚀 Publish Cafe
                    </button>
                </form>
            </div>
            <hr />

            <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
                {cafes.map((cafe) => (
                    /* 🌟 NEW: Wrapped the card in a Link component */
                    <Link to={`/cafe/${cafe._id}`} key={cafe._id} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', backgroundColor: 'white' }}>
                            <h2 style={{ margin: '0 0 10px 0' }}>{cafe.name} {cafe.rating && `(⭐️ ${cafe.rating})`}</h2>
                            <p style={{ margin: '5px 0' }}>📍 {cafe.address}</p>
                            <p style={{ margin: '5px 0', color: '#666' }}>
                                {cafe.has_good_wifi ? '📶 Fast WiFi' : '📶 No WiFi'} |
                                {cafe.is_quiet ? ' 🤫 Quiet to study' : ' 🗣️ Good for chatting'}
                            </p>
                            {cafe.cover_image && (
                                <img src={cafe.cover_image} alt={cafe.name} style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '4px', marginTop: '10px' }} />
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default Home; // 🌟 Crucial: Export as Home now!