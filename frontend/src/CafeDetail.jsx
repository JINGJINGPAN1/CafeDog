import { useCallback, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; // 🌟 NEW: Imported useNavigate
import { apiFetch } from './lib/api';
import { useAuth } from './auth/useAuth';
import PostCard from './components/PostCard';
import './CafeDetail.css';

function CafeDetail() {
  const { id } = useParams();
  const navigate = useNavigate(); // 🌟 NEW: Initialize the navigation tool
  const { me, isLoggedIn } = useAuth();

  const [cafe, setCafe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState([])

  const [posts, setPosts] = useState([]);
  const [postsPage, setPostsPage] = useState(1);
  const [postsTotal, setPostsTotal] = useState(0);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const POSTS_PER_PAGE = 10;

  const [formData, setFormData] = useState({
    author: '',
    text: '',
    photoUrl: '',
    rating: '5',
  });

  const reloadPosts = useCallback(async () => {
    try {
      const data = await apiFetch(`/api/cafes/${id}/posts?page=1&limit=${POSTS_PER_PAGE}`);
      setPosts(Array.isArray(data.posts) ? data.posts : []);
      setPostsTotal(data.total || 0);
      setPostsPage(1);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  }, [id]);

  const loadMorePosts = async () => {
    const nextPage = postsPage + 1;
    setLoadingMorePosts(true);
    try {
      const data = await apiFetch(`/api/cafes/${id}/posts?page=${nextPage}&limit=${POSTS_PER_PAGE}`);
      const newPosts = Array.isArray(data.posts) ? data.posts : [];
      setPosts((prev) => [...prev, ...newPosts]);
      setPostsTotal(data.total || 0);
      setPostsPage(nextPage);
    } catch (err) {
      console.error('Error loading more posts:', err);
    } finally {
      setLoadingMorePosts(false);
    }
  };

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cafeId: id,
          author: formData.author,
          text: formData.text,
          photoUrl: formData.photoUrl,
          rating: formData.rating,
        }),
      });
      setFormData({ author: '', text: '', photoUrl: '', rating: '5' });
      reloadPosts();
    } catch (err) {
      console.error(err);
      alert('Error creating post: ' + err.message);
    }
  };

  useEffect(() => {
    let cancelled = false;

    apiFetch(`/api/cafes/${id}`)
      .then((data) => {
        if (!cancelled) setCafe(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    (async () => {
      try {
        const data = await apiFetch(`/api/cafes/${id}/posts?page=1&limit=${POSTS_PER_PAGE}`);
        if (!cancelled) {
          setPosts(Array.isArray(data.posts) ? data.posts : []);
          setPostsTotal(data.total || 0);
          setPostsPage(1);
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // 🌟 NEW: The function to handle the deletion process
  const handleDelete = async () => {
    // 1. Ask the user for confirmation first to prevent accidental clicks!
    const isConfirmed = window.confirm(
      'Are you sure you want to delete this cafe? This action cannot be undone.',
    );
    if (!isConfirmed) return; // Stop execution if they click "Cancel"

    try {
      await apiFetch(`/api/cafes/${id}`, { method: 'DELETE' });

      // 3. Success! Notify the user and redirect back to the home page
      alert('🗑️ Cafe deleted successfully!');
      navigate('/'); // Programmatically send the user back to the root URL
    } catch (err) {
      alert('Error deleting: ' + err.message);
    }
  };

  const startEditing = () => {
    setEditData({
      name: cafe.name,
      address: cafe.address,
      has_good_wifi: cafe.has_good_wifi,
      is_quiet: cafe.is_quiet,
      rating: cafe.rating ?? '',
      cover_image: cafe.cover_image || '',
    });
    setIsEditing(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/cafes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      // Update local state so the page reflects changes immediately
      setCafe((prev) => ({ ...prev, ...editData }));
      setIsEditing(false);
    } catch (err) {
      alert('Error updating cafe: ' + err.message);
    }
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };


  if (loading) return <h2>Loading cafe details... ⏳</h2>;
  if (error) return <h2 style={{ color: 'red' }}>Error: {error}</h2>;
  if (!cafe) return <h2>Cafe not found. 🕵️‍♂️</h2>;

  return (
    <div className="page">
      {/* Top Navigation & Action Bar */}
      <div className="topBar">
        <Link to="/" className="backLink">&larr; Back to Home</Link>
        {me && cafe.createdBy && String(me._id) === String(cafe.createdBy) ? (
          <div>
            <button onClick={startEditing} className="primaryButton">Edit Cafe</button>
            <button onClick={handleDelete} className="dangerButton">Delete Cafe</button>
          </div>
        ) : null}
      </div>

      {/* Cafe Details Card */}

      {isEditing ? (
        <form onSubmit={handleEditSubmit} className="cafeCard">
          <label>Name:
            <input className="input" name="name" value={editData.name} onChange={handleEditChange} required />
          </label>
          <label>Address:
            <input className="input" name="address" value={editData.address} onChange={handleEditChange} required />
          </label>
          <label>
            <input type="checkbox" name="has_good_wifi" checked={editData.has_good_wifi} onChange={handleEditChange} />
            Good WiFi
          </label>
          <label>
            <input type="checkbox" name="is_quiet" checked={editData.is_quiet} onChange={handleEditChange} />
            Quiet for studying
          </label>
          <label>Rating:
            <select className="select" name="rating" value={editData.rating} onChange={handleEditChange}>
              <option value="">No rating</option>
              <option value="5">5</option>
              <option value="4">4</option>
              <option value="3">3</option>
              <option value="2">2</option>
              <option value="1">1</option>
            </select>
          </label>
          <label>Cover Image URL:
            <input className="input" name="cover_image" value={editData.cover_image} onChange={handleEditChange} />
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="primaryButton">Save</button>
            <button type="button" onClick={() => setIsEditing(false)} className="dangerButton">Cancel</button>
          </div>
        </form>
      ) :
        (<div className="cafeCard">
          <h1 className="cafeTitle">
            {cafe.name} {cafe.rating && <span className="cafeRating">(⭐️ {cafe.rating})</span>}
          </h1>
          <h3 className="cafeAddress">📍 {cafe.address}</h3>

          <div className="cafeInfo">
            <p>{cafe.has_good_wifi ? '✅ Fast WiFi Available' : '❌ No WiFi'}</p>
            <p>{cafe.is_quiet ? '✅ Quiet for studying' : '🗣️ Good for chatting'}</p>
          </div>

          {cafe.cover_image && <img src={cafe.cover_image} alt={cafe.name} className="cafeCover" />}
        </div>)}

      <hr className="sectionDivider" />

      {/* 🌟 NEW: The Reviews Section */}
      <div>
        <h2>📸 Check-ins & Posts</h2>

        {/* Review Submission Form */}
        <div className="postFormWrap">
          <h4 style={{ marginTop: 0 }}>Post your check-in</h4>
          <form onSubmit={handleReviewSubmit} className="postForm">
            {isLoggedIn ? (
              <div className="muted">
                Posting as <strong>{me?.username || me?.email}</strong>
              </div>
            ) : (
              <input
                className="input"
                type="text"
                name="author"
                placeholder="Your Name"
                value={formData.author}
                onChange={handleReviewChange}
                required
              />
            )}
            <textarea
              className="textarea"
              name="text"
              placeholder="Share your experience or photography notes..."
              value={formData.text}
              onChange={handleReviewChange}
              required
              rows="3"
            />
            <input
              className="input"
              type="text"
              name="photoUrl"
              placeholder="Link to your best shot (Optional)"
              value={formData.photoUrl}
              onChange={handleReviewChange}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label>Rating:</label>
              <select
                className="select"
                name="rating"
                value={formData.rating}
                onChange={handleReviewChange}
              >
                <option value="5">⭐️⭐️⭐️⭐️⭐️ (5)</option>
                <option value="4">⭐️⭐️⭐️⭐️ (4)</option>
                <option value="3">⭐️⭐️⭐️ (3)</option>
                <option value="2">⭐️⭐️ (2)</option>
                <option value="1">⭐️ (1)</option>
              </select>
            </div>
            <button type="submit" className="primaryButton">
              Submit Post
            </button>
          </form>
        </div>

        {/* Reviews List */}
        <div className="postList">
          {posts.length === 0 ? (
            <p style={{ color: '#888', fontStyle: 'italic' }}>
              No posts yet. Be the first to check in!
            </p>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onUpdate={reloadPosts}
                onDelete={reloadPosts}
              />
            ))
          )}
        </div>
        {posts.length < postsTotal ? (
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <button
              type="button"
              className="primaryButton"
              onClick={loadMorePosts}
              disabled={loadingMorePosts}
              style={{ padding: '10px 28px', opacity: loadingMorePosts ? 0.65 : 1 }}
            >
              {loadingMorePosts ? 'Loading...' : 'Load More Posts'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default CafeDetail;
