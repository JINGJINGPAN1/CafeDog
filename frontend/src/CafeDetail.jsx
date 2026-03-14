import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; // 🌟 NEW: Imported useNavigate

function CafeDetail() {
    const { id } = useParams();
    const navigate = useNavigate(); // 🌟 NEW: Initialize the navigation tool

    const [cafe, setCafe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`http://localhost:5001/api/cafes/${id}`)
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch cafe details from the server.');
                return res.json();
            })
            .then((data) => {
                setCafe(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching detail:", err);
                setError(err.message);
                setLoading(false);
            });
    }, [id]);

    // 🌟 NEW: The function to handle the deletion process
    const handleDelete = async () => {
        // 1. Ask the user for confirmation first to prevent accidental clicks!
        const isConfirmed = window.confirm("Are you sure you want to delete this cafe? This action cannot be undone.");
        if (!isConfirmed) return; // Stop execution if they click "Cancel"

        try {
            // 2. Send the DELETE request to our new backend route
            const response = await fetch(`http://localhost:5001/api/cafes/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete the cafe.');
            }

            // 3. Success! Notify the user and redirect back to the home page
            alert("🗑️ Cafe deleted successfully!");
            navigate('/'); // Programmatically send the user back to the root URL

        } catch (err) {
            alert("Error deleting: " + err.message);
        }
    };

    if (loading) return <h2>Loading cafe details... ⏳</h2>;
    if (error) return <h2 style={{ color: 'red' }}>Error: {error}</h2>;
    if (!cafe) return <h2>Cafe not found. 🕵️‍♂️</h2>;

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>

            {/* Top Navigation & Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <Link to="/" style={{ textDecoration: 'none', color: '#007bff', fontSize: '18px' }}>
                    &larr; Back to Home
                </Link>

                {/* 🌟 NEW: The Delete Button */}
                <button
                    onClick={handleDelete}
                    style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    🗑️ Delete Cafe
                </button>
            </div>

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