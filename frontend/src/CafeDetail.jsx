import { useCallback, useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiFetch } from './lib/api';
import { useAuth } from './auth/useAuth';
import PostCard from './components/PostCard';

const AVATAR_THEMES = [
  { bg: '#F5C4B3', color: '#712B13' },
  { bg: '#E1F5EE', color: '#085041' },
  { bg: '#EEEDFE', color: '#3C3489' },
];

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getInitials(name) {
  if (!name) return '?';
  return name.slice(0, 2).toUpperCase();
}

function CafeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { me, isLoggedIn } = useAuth();
  const formRef = useRef(null);
  const reviewTextRef = useRef(null);

  const [cafe, setCafe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState([]);

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

  const handleDelete = async () => {
    const isConfirmed = window.confirm(
      'Are you sure you want to delete this cafe? This action cannot be undone.',
    );
    if (!isConfirmed) return;

    try {
      await apiFetch(`/api/cafes/${id}`, { method: 'DELETE' });
      alert('Cafe deleted successfully!');
      navigate('/');
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

  const scrollToForm = () => {
    if (reviewTextRef.current) {
      reviewTextRef.current.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => reviewTextRef.current?.focus(), 400);
    }
  };

  const isOwner = me && cafe && cafe.createdBy && String(me._id) === String(cafe.createdBy);

  /* ── Render helpers ── */
  const renderStars = (n) => {
    const count = Number(n) || 0;
    let s = '';
    for (let i = 0; i < 5; i++) s += i < count ? '\u2605' : '\u2606';
    return s;
  };

  const heartSvg = (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#ccc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );

  const bookmarkSvg = (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );

  /* ── Loading / Error / Not found ── */
  if (loading) {
    return (
      <>
        <style>{S}</style>
        <div className="cd-page">
          <p style={{ textAlign: 'center', padding: '120px 0', color: '#999' }}>Loading...</p>
        </div>
      </>
    );
  }
  if (error) {
    return (
      <>
        <style>{S}</style>
        <div className="cd-page">
          <p style={{ textAlign: 'center', padding: '120px 0', color: '#b00020' }}>Error: {error}</p>
        </div>
      </>
    );
  }
  if (!cafe) {
    return (
      <>
        <style>{S}</style>
        <div className="cd-page">
          <p style={{ textAlign: 'center', padding: '120px 0', color: '#999' }}>Cafe not found.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{S}</style>
      <div className="cd-page">
        {/* ══════ NAVBAR ══════ */}
        <header className="cd-nav">
          <Link to="/" className="cd-back">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <span className="cd-nav-title">{cafe.name}</span>
          <div className="cd-nav-right">
            {isOwner ? (
              <>
                <button type="button" className="cd-btn-edit" onClick={startEditing}>Edit</button>
                <button type="button" className="cd-btn-del" onClick={handleDelete}>Delete</button>
              </>
            ) : <span style={{ width: 60 }} />}
          </div>
        </header>

        {/* ══════ TWO-COLUMN BODY ══════ */}
        <div className="cd-body">
          {/* ── LEFT COLUMN ── */}
          <div className="cd-left">
            {/* Hero */}
            <div className="cd-hero">
              {cafe.cover_image ? (
                <img className="cd-hero-img" src={cafe.cover_image} alt={cafe.name} />
              ) : (
                <div className="cd-hero-ph">
                  <span className="cd-hero-emoji">&#9749;</span>
                </div>
              )}
              <div className="cd-dots">
                <span className="cd-dot cd-dot--on" />
                <span className="cd-dot" />
                <span className="cd-dot" />
              </div>
            </div>

            {/* Info or Edit Form */}
            {isEditing ? (
              <div className="cd-left-pad">
                <form onSubmit={handleEditSubmit} className="cd-eform">
                  <h3 className="cd-eform-title">Edit Cafe</h3>
                  <input className="cd-inp" name="name" value={editData.name} onChange={handleEditChange} placeholder="Name" required />
                  <input className="cd-inp" name="address" value={editData.address} onChange={handleEditChange} placeholder="Address" required />
                  <div className="cd-eform-row">
                    <label className="cd-ck"><input type="checkbox" name="has_good_wifi" checked={editData.has_good_wifi} onChange={handleEditChange} /> WiFi</label>
                    <label className="cd-ck"><input type="checkbox" name="is_quiet" checked={editData.is_quiet} onChange={handleEditChange} /> Quiet</label>
                  </div>
                  <select className="cd-inp" name="rating" value={editData.rating} onChange={handleEditChange}>
                    <option value="">No rating</option>
                    <option value="5">5</option><option value="4">4</option><option value="3">3</option><option value="2">2</option><option value="1">1</option>
                  </select>
                  <input className="cd-inp" name="cover_image" value={editData.cover_image} onChange={handleEditChange} placeholder="Cover image URL" />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="submit" className="cd-post-btn" style={{ flex: 1 }}>Save</button>
                    <button type="button" className="cd-cancel" onClick={() => setIsEditing(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="cd-left-pad">
                {/* Name */}
                <div className="cd-name">{cafe.name}</div>

                {/* Address */}
                <div className="cd-addr">
                  <span className="cd-pin" />
                  <span>{cafe.address}</span>
                </div>

                {/* Badges */}
                <div className="cd-badges">
                  {cafe.has_good_wifi ? <span className="cd-badge cd-badge--wifi">wifi</span> : null}
                  {cafe.is_quiet ? <span className="cd-badge cd-badge--quiet">quiet</span> : null}
                  {cafe.rating ? <span className="cd-badge cd-badge--rating">&#9733; {cafe.rating}</span> : null}
                </div>

                <div className="cd-hr" />

                {/* Stats */}
                <div className="cd-stats">
                  <div className="cd-stat">
                    <span className="cd-stat-n">{postsTotal}</span>
                    <span className="cd-stat-l">check-ins</span>
                  </div>
                  <div className="cd-stat">
                    <span className="cd-stat-n">{cafe.rating || '-'}</span>
                    <span className="cd-stat-l">avg rating</span>
                  </div>
                  <div className="cd-stat">
                    <span className="cd-stat-n">0</span>
                    <span className="cd-stat-l">saves</span>
                  </div>
                </div>

                <div className="cd-hr" />

                {/* Map placeholder */}
                <div className="cd-map">&#128205; map coming soon</div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="cd-right">
            {/* Header */}
            <div className="cd-rh">
              <span className="cd-rh-title">check-ins &amp; reviews</span>
              <span className="cd-rh-count">{postsTotal} reviews</span>
            </div>

            {/* Reviews list */}
            <div className="cd-reviews">
              {posts.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#bbb', padding: '40px 0', fontSize: 13 }}>
                  No posts yet. Be the first to check in!
                </p>
              ) : (
                posts.map((post, idx) => {
                  const theme = AVATAR_THEMES[idx % 3];
                  return (
                    <div key={post._id} className="cd-rv">
                      <div className="cd-rv-head">
                        <div className="cd-rv-left">
                          <span className="cd-av" style={{ background: theme.bg, color: theme.color }}>
                            {getInitials(post.author)}
                          </span>
                          <div>
                            <div className="cd-rv-author">
                              {post.authorId ? (
                                <Link to={`/profile/${post.authorId}`} className="cd-rv-author-link">{post.author}</Link>
                              ) : post.author}
                            </div>
                            <div className="cd-rv-time">{timeAgo(post.createdAt || post.createAt)}</div>
                          </div>
                        </div>
                        <span className="cd-rv-stars">{renderStars(post.rating)}</span>
                      </div>
                      <p className="cd-rv-text">{post.text}</p>
                      {post.photoUrl ? (
                        <img className="cd-rv-photo" src={post.photoUrl} alt="review" />
                      ) : null}
                      <div className="cd-rv-foot">
                        <span className="cd-rv-act">{heartSvg} 0</span>
                        <span className="cd-rv-act" style={{ color: '#bbb', fontSize: 12 }}>reply</span>
                      </div>
                    </div>
                  );
                })
              )}

              {posts.length < postsTotal ? (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <button type="button" className="cd-more" onClick={loadMorePosts} disabled={loadingMorePosts}>
                    {loadingMorePosts ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              ) : null}

              {/* Full review form */}
              <div className="cd-fform" ref={formRef}>
                <h4 className="cd-fform-title">Share your experience</h4>
                <form onSubmit={handleReviewSubmit} className="cd-fform-inner">
                  {isLoggedIn ? (
                    <div style={{ fontSize: 13, color: '#888' }}>
                      Posting as <strong>{me?.username || me?.email}</strong>
                    </div>
                  ) : (
                    <input className="cd-inp" type="text" name="author" placeholder="Your name" value={formData.author} onChange={handleReviewChange} required />
                  )}
                  <textarea className="cd-inp cd-ta" ref={reviewTextRef} name="text" placeholder="What did you love about this place?" value={formData.text} onChange={handleReviewChange} required rows="3" />
                  <input className="cd-inp" type="text" name="photoUrl" placeholder="Photo URL (optional)" value={formData.photoUrl} onChange={handleReviewChange} />
                  <div className="cd-star-row">
                    <span className="cd-star-label">Rating</span>
                    <div className="cd-stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`cd-star ${Number(formData.rating) >= star ? 'cd-star--on' : 'cd-star--off'}`}
                          onClick={() => setFormData((prev) => ({ ...prev, rating: String(star) }))}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="cd-post-btn">Post Check-in</button>
                </form>
              </div>
            </div>

            {/* Bottom action bar */}
            <div className="cd-bar">
              <div className="cd-bar-input-row">
                <button type="button" className="cd-bar-pill" onClick={scrollToForm}>
                  ✏️ write a review
                </button>
              </div>
              <div className="cd-bar-actions">
                <span className="cd-bar-act">{heartSvg} <span>0 likes</span></span>
                <span className="cd-bar-act">{bookmarkSvg} <span>save</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const S = `
  * { box-sizing: border-box; }

  .cd-page {
    min-height: 100vh;
    background: #f7f5f2;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    display: flex;
    flex-direction: column;
  }

  /* ── Navbar ── */
  .cd-nav {
    position: sticky; top: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    height: 53px; padding: 0 16px;
    background: #fff; border-bottom: 0.5px solid #e5e4e7;
    flex-shrink: 0;
  }
  .cd-back {
    width: 32px; height: 32px; border-radius: 50%; background: #f3f2f0;
    display: flex; align-items: center; justify-content: center;
    text-decoration: none; flex-shrink: 0;
  }
  .cd-nav-title {
    font-size: 15px; font-weight: 500; color: #222;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    position: absolute; left: 50%; transform: translateX(-50%);
    max-width: 40%;
  }
  .cd-nav-right { display: flex; gap: 6px; flex-shrink: 0; }
  .cd-btn-edit {
    font-size: 12px; padding: 5px 14px; border-radius: 14px;
    border: 1px solid #C97B4B; background: none; color: #C97B4B;
    cursor: pointer; font-weight: 500;
  }
  .cd-btn-del {
    font-size: 12px; padding: 5px 14px; border-radius: 14px;
    border: 1px solid #dc3545; background: none; color: #dc3545;
    cursor: pointer; font-weight: 500;
  }

  /* ── Two-column body ── */
  .cd-body {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    height: calc(100vh - 53px);
  }

  /* Left */
  .cd-left {
    overflow-y: auto; border-right: 0.5px solid #e5e4e7;
    background: #f7f5f2;
  }
  .cd-left-pad { padding: 20px 24px; }

  .cd-hero { position: relative; width: 100%; }
  .cd-hero-img { width: 100%; height: 280px; object-fit: cover; display: block; }
  .cd-hero-ph {
    width: 100%; height: 280px;
    background: linear-gradient(160deg, #F5C4B3, #FAEEDA, #E1F5EE);
    display: flex; align-items: center; justify-content: center;
  }
  .cd-hero-emoji { font-size: 72px; opacity: 0.2; }
  .cd-dots {
    position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
    display: flex; gap: 5px; align-items: center;
  }
  .cd-dot { width: 6px; height: 6px; border-radius: 3px; background: rgba(255,255,255,0.45); }
  .cd-dot--on { width: 18px; background: #fff; }

  .cd-name { font-size: 22px; font-weight: 500; color: #222; margin-bottom: 8px; }
  .cd-addr { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #999; margin-bottom: 12px; }
  .cd-pin {
    width: 8px; height: 8px; border-radius: 50%;
    background: #C97B4B; flex-shrink: 0;
  }

  .cd-badges { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
  .cd-badge {
    font-size: 11px; font-weight: 600; padding: 3px 10px;
    border-radius: 12px; border: 1px solid;
  }
  .cd-badge--wifi { background: #FDF0E8; color: #854F0B; border-color: #EF9F27; }
  .cd-badge--quiet { background: #E1F5EE; color: #085041; border-color: #5DCAA5; }
  .cd-badge--rating { background: #EEEDFE; color: #3C3489; border-color: #7F77DD; }

  .cd-hr { border: none; border-top: 0.5px solid #eee; margin: 14px 0; height: 0; }

  .cd-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; text-align: center; }
  .cd-stat { display: flex; flex-direction: column; gap: 2px; }
  .cd-stat-n { font-size: 16px; font-weight: 600; color: #C97B4B; }
  .cd-stat-l { font-size: 11px; color: #aaa; }

  .cd-map {
    height: 120px; background: #eee; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; color: #bbb; margin-top: 4px;
  }

  /* Edit form (in left column) */
  .cd-eform { display: flex; flex-direction: column; gap: 10px; }
  .cd-eform-title { font-size: 17px; font-weight: 600; color: #222; margin: 0 0 4px; }
  .cd-eform-row { display: flex; gap: 16px; }
  .cd-ck { display: flex; align-items: center; gap: 5px; font-size: 13px; color: #555; cursor: pointer; }
  .cd-cancel {
    padding: 10px 20px; border-radius: 10px; border: 1px solid #ddd;
    background: #fff; color: #666; cursor: pointer; font-size: 14px;
  }

  /* ── Right column ── */
  .cd-right {
    display: flex; flex-direction: column; background: #fff;
  }

  .cd-rh {
    display: flex; justify-content: space-between; align-items: center;
    padding: 16px 20px; border-bottom: 0.5px solid #e5e4e7; flex-shrink: 0;
  }
  .cd-rh-title { font-size: 15px; font-weight: 500; color: #222; }
  .cd-rh-count { font-size: 12px; color: #aaa; }

  .cd-reviews {
    flex: 1; overflow-y: auto; padding: 12px 20px;
    display: flex; flex-direction: column; gap: 12px;
  }

  /* Review card */
  .cd-rv {
    border: 0.5px solid #e5e4e7; border-radius: 12px;
    padding: 14px; background: #fafafa;
  }
  .cd-rv-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
  .cd-rv-left { display: flex; gap: 10px; align-items: center; }
  .cd-av {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; flex-shrink: 0; letter-spacing: 0.3px;
  }
  .cd-rv-author { font-size: 13px; font-weight: 500; color: #222; }
  .cd-rv-author-link { color: #222; text-decoration: none; }
  .cd-rv-author-link:hover { color: #C97B4B; }
  .cd-rv-time { font-size: 11px; color: #bbb; margin-top: 1px; }
  .cd-rv-stars { font-size: 13px; color: #EF9F27; flex-shrink: 0; letter-spacing: 1px; }

  .cd-rv-text { font-size: 13px; line-height: 1.6; color: #333; margin: 0 0 6px; white-space: pre-wrap; }
  .cd-rv-photo {
    width: 100%; height: 160px; object-fit: cover;
    border-radius: 8px; margin: 8px 0; display: block;
  }
  .cd-rv-foot { display: flex; justify-content: flex-end; gap: 14px; align-items: center; }
  .cd-rv-act { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #ccc; }

  .cd-more {
    padding: 7px 24px; font-size: 13px; font-weight: 500;
    background: #fff; border: 1px solid #e5e4e7; border-radius: 16px;
    color: #888; cursor: pointer; transition: all 0.15s;
  }
  .cd-more:hover { border-color: #C97B4B; color: #C97B4B; }
  .cd-more:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Full form inside reviews */
  .cd-fform {
    border-top: 0.5px solid #eee; padding-top: 16px; margin-top: 8px;
  }
  .cd-fform-title { font-size: 14px; font-weight: 500; color: #222; margin: 0 0 10px; }
  .cd-fform-inner { display: flex; flex-direction: column; gap: 8px; }

  /* Shared inputs */
  .cd-inp {
    padding: 10px 14px; border-radius: 10px; border: 1px solid #e5e4e7;
    font-size: 13px; outline: none; background: #fafaf9; color: #222;
    transition: border-color 0.15s; font-family: inherit;
  }
  .cd-inp::placeholder { color: #bbb; }
  .cd-inp:focus { border-color: #C97B4B; background: #fff; }
  .cd-ta { resize: vertical; min-height: 60px; line-height: 1.5; color: #222; }

  /* Star picker */
  .cd-star-row { display: flex; align-items: center; gap: 10px; }
  .cd-star-label { font-size: 13px; color: #888; }
  .cd-stars { display: flex; gap: 4px; }
  .cd-star {
    font-size: 24px; cursor: pointer; background: none; border: none;
    padding: 0; line-height: 1; transition: transform 0.1s;
  }
  .cd-star:hover { transform: scale(1.2); }
  .cd-star--on { color: #EF9F27; }
  .cd-star--off { color: #ddd; }

  .cd-post-btn {
    padding: 11px; border-radius: 20px; border: none;
    background: #C97B4B; color: #fff; font-size: 14px; font-weight: 600;
    cursor: pointer; width: 100%; transition: background 0.15s;
  }
  .cd-post-btn:hover { background: #b56a3d; }

  /* ── Bottom bar ── */
  .cd-bar {
    flex-shrink: 0; padding: 12px 20px;
    border-top: 0.5px solid #e5e4e7; background: #fff;
    position: sticky; bottom: 0;
  }
  .cd-bar-input-row {
    display: flex; gap: 8px; align-items: center; margin-bottom: 8px;
  }
  .cd-bar-pill {
    flex: 1; padding: 9px 18px; border-radius: 20px;
    background: #FDF0E8; color: #854F0B;
    border: 0.5px solid #EF9F27;
    font-size: 13px; font-family: inherit;
    cursor: pointer; text-align: left;
    transition: background 0.15s;
  }
  .cd-bar-pill:hover { background: #fbe5d3; }
  .cd-bar-actions {
    display: flex; gap: 18px; align-items: center;
  }
  .cd-bar-act {
    display: flex; align-items: center; gap: 5px;
    font-size: 12px; color: #aaa;
  }

  /* ── Responsive: single column on mobile ── */
  @media (max-width: 768px) {
    .cd-body {
      grid-template-columns: 1fr;
      height: auto;
    }
    .cd-left {
      border-right: none;
      overflow-y: visible;
    }
    .cd-right {
      height: auto;
    }
    .cd-reviews {
      overflow-y: visible;
    }
  }
`;

export default CafeDetail;
