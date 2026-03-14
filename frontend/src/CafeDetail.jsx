import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; // 🌟 NEW: Imported useNavigate

function CafeDetail() {
    const { id } = useParams();
    const navigate = useNavigate(); // 🌟 NEW: Initialize the navigation tool

    const [cafe, setCafe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [reviews, setReviews] = useState([]);
    const [formData, setFormData] = useState({
        author: '',
        text: '',
        photoUrl: '',
        rating: '5'
    });

    const fetchReviews = () => {
        fetch(`http://localhost:5001/api/cafes/${id}/reviews`)
            .then(res => res.json())
            .then(data => setReviews(data))
            .catch((err) => console.error("Error fetching reviews:", err));
    };

    const handleReviewChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5001/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cafeId: id,
                    author: formData.author,
                    text: formData.text,
                    photoUrl: formData.photoUrl,
                    rating: formData.rating
                })
            });
            if (!res.ok) throw new Error('Failed to post review');
            setFormData({ author: '', text: '', photoUrl: '', rating: '5' });
            fetchReviews();
        } catch (err) {
            console.error(err);
            alert('Error posting review: ' + err.message);
        }
    };

    useEffect(() => {
        let cancelled = false;

        fetch(`http://localhost:5001/api/cafes/${id}`)
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch cafe details from the server.');
                return res.json();
            })
            .then((data) => {
                if (!cancelled) {
                    setCafe(data);
                }
                setLoading(false);
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err.message);
                }
                setLoading(false);
            });

        fetchReviews();

        return () => { cancelled = true; };
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
                <button onClick={handleDelete} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    🗑️ Delete Cafe
                </button>
            </div>

            {/* Cafe Details Card */}
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '40px' }}>
                <h1 style={{ marginTop: 0, fontSize: '2.5rem' }}>
                    {cafe.name} {cafe.rating && <span style={{ fontSize: '1.5rem', color: '#f39c12' }}>(⭐️ {cafe.rating})</span>}
                </h1>
                <h3 style={{ color: '#555', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>📍 {cafe.address}</h3>

                <div style={{ margin: '20px 0', padding: '15px', backgroundColor: '#f8f9fa', borderLeft: '5px solid #007bff', borderRadius: '4px' }}>
                    <p style={{ margin: '5px 0', fontSize: '1.1rem' }}>{cafe.has_good_wifi ? '✅ Fast WiFi Available' : '❌ No WiFi'} </p>
                    <p style={{ margin: '5px 0', fontSize: '1.1rem' }}>{cafe.is_quiet ? '✅ Quiet for studying' : '🗣️ Good for chatting'}</p>
                </div>

                {cafe.cover_image && (
                    <img src={cafe.cover_image} alt={cafe.name} style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '8px', marginTop: '10px' }} />
                )}
            </div>

            <hr style={{ border: '1px solid #eee', marginBottom: '40px' }} />

            {/* 🌟 NEW: The Reviews Section */}
            <div>
                <h2>📸 Check-ins & Reviews</h2>

                {/* Review Submission Form */}
                <div style={{ backgroundColor: '#f0f8ff', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
                    <h4 style={{ marginTop: 0 }}>Post your check-in</h4>
                    <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <input type="text" name="author" placeholder="Your Name" value={formData.author} onChange={handleReviewChange} required style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                        <textarea name="text" placeholder="Share your experience or photography notes..." value={formData.text} onChange={handleReviewChange} required rows="3" style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                        <input type="text" name="photoUrl" placeholder="Link to your best shot (Optional)" value={formData.photoUrl} onChange={handleReviewChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label>Rating:</label>
                            <select name="rating" value={formData.rating} onChange={handleReviewChange} style={{ padding: '5px' }}>
                                <option value="5">⭐️⭐️⭐️⭐️⭐️ (5)</option>
                                <option value="4">⭐️⭐️⭐️⭐️ (4)</option>
                                <option value="3">⭐️⭐️⭐️ (3)</option>
                                <option value="2">⭐️⭐️ (2)</option>
                                <option value="1">⭐️ (1)</option>
                            </select>
                        </div>
                        <button type="submit" style={{ padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                            Submit Review
                        </button>
                    </form>
                </div>

                {/* Reviews List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {reviews.length === 0 ? (
                        <p style={{ color: '#888', fontStyle: 'italic' }}>No reviews yet. Be the first to check in!</p>
                    ) : (
                        reviews.map((review) => (
                            <div key={review._id} style={{ border: '1px solid #e0e0e0', padding: '20px', borderRadius: '8px', backgroundColor: 'white' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <strong>👤 {review.author}</strong>
                                    <span style={{ color: '#f39c12' }}>{'⭐️'.repeat(review.rating)}</span>
                                </div>
                                <p style={{ margin: '10px 0', lineHeight: '1.5' }}>{review.text}</p>
                                {/* Render the stunning photo if they provided one */}
                                {review.photoUrl && (
                                    <img src={review.photoUrl} alt="Review attachment" style={{ width: '100%', maxHeight: '500px', objectFit: 'cover', borderRadius: '6px', marginTop: '10px' }} />
                                )}
                                <small style={{ color: '#aaa', display: 'block', marginTop: '10px' }}>
                                    Posted on: {new Date(review.createAt || review.createdAt).toLocaleDateString()}
                                </small>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
    );
}

export default CafeDetail;