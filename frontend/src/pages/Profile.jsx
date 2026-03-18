import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { apiFetch } from '../lib/api';
import { useAuth } from '../auth/useAuth';
import './Profile.css';

function getInitials(name) {
  if (!name) return '?';
  return name.slice(0, 2).toUpperCase();
}

function renderStars(n) {
  const count = Number(n) || 0;
  let s = '';
  for (let i = 0; i < 5; i++) s += i < count ? '\u2605' : '\u2606';
  return s;
}

function ProfilePostCard({ post }) {
  return (
    <Link to={`/cafe/${post.cafeId}`} className="pf-post">
      <div className="pf-post-head">
        <span className="pf-post-stars">{renderStars(post.rating)}</span>
        <span className="pf-post-date">
          {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}
        </span>
      </div>
      <p className="pf-post-text">{post.text}</p>
      {post.photoUrl ? (
        <img className="pf-post-photo" src={post.photoUrl} alt="Post" />
      ) : null}
    </Link>
  );
}

ProfilePostCard.propTypes = {
  post: PropTypes.shape({
    _id: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
    cafeId: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
    text: PropTypes.string.isRequired,
    rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    photoUrl: PropTypes.string,
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  }).isRequired,
};

function ProfileCafeCard({ cafe }) {
  return (
    <Link to={`/cafe/${cafe._id}`} className="pf-cafe">
      {cafe.cover_image ? (
        <img className="pf-cafe-img" src={cafe.cover_image} alt={cafe.name} />
      ) : (
        <div className="pf-cafe-ph">&#9749;</div>
      )}
      <div className="pf-cafe-info">
        <span className="pf-cafe-name">{cafe.name}</span>
        {cafe.rating ? <span className="pf-cafe-rating">{renderStars(cafe.rating)}</span> : null}
        <span className="pf-cafe-addr">{cafe.address}</span>
      </div>
    </Link>
  );
}

ProfileCafeCard.propTypes = {
  cafe: PropTypes.shape({
    _id: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
    name: PropTypes.string.isRequired,
    address: PropTypes.string,
    rating: PropTypes.number,
    cover_image: PropTypes.string,
  }).isRequired,
};

export default function Profile() {
  const { id } = useParams();
  const { me } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('posts');

  const isSelf = me && String(me._id) === String(id);

  useEffect(() => {
    setLoading(true);
    setError('');
    apiFetch(`/api/users/${id}`)
      .then((data) => setProfile(data))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="pf-page">
        <p style={{ textAlign: 'center', padding: '120px 0', color: '#999' }}>Loading profile...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="pf-page">
        <p style={{ textAlign: 'center', padding: '120px 0', color: '#b00020' }}>Error: {error}</p>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="pf-page">
        <p style={{ textAlign: 'center', padding: '120px 0', color: '#999' }}>User not found.</p>
      </div>
    );
  }

  const { user, posts, cafes, likedPosts } = profile;

  return (
    <div className="pf-page">
      {/* Navbar */}
      <header className="pf-nav">
        <Link to="/" className="pf-back">&larr; Back to Home</Link>
      </header>

      {/* Profile header card */}
      <div className="pf-card">
        <div className="pf-header">
          <div className="pf-avatar">{getInitials(user.username)}</div>
          <div className="pf-meta">
            <div className="pf-name-row">
              <h1 className="pf-name">{user.username}</h1>
              {isSelf ? <span className="pf-badge">You</span> : null}
            </div>
            <p className="pf-email">{user.email}</p>
            <p className="pf-joined">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="pf-divider" />

        {/* Stats */}
        <div className="pf-stats">
          <div className="pf-stat">
            <span className="pf-stat-n">{posts.length}</span>
            <span className="pf-stat-l">Posts</span>
          </div>
          <div className="pf-stat">
            <span className="pf-stat-n">{cafes.length}</span>
            <span className="pf-stat-l">Cafes Added</span>
          </div>
          <div className="pf-stat">
            <span className="pf-stat-n">{likedPosts.length}</span>
            <span className="pf-stat-l">Likes</span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="pf-tabs">
        <button type="button" className={`pf-tab ${tab === 'posts' ? 'pf-tab--on' : ''}`} onClick={() => setTab('posts')}>Posts</button>
        <button type="button" className={`pf-tab ${tab === 'cafes' ? 'pf-tab--on' : ''}`} onClick={() => setTab('cafes')}>Cafes Added</button>
        <button type="button" className={`pf-tab ${tab === 'liked' ? 'pf-tab--on' : ''}`} onClick={() => setTab('liked')}>Liked Posts</button>
      </div>

      {/* Content */}
      <div className="pf-content">
        {tab === 'posts' && (
          posts.length === 0 ? (
            <p className="pf-empty">No posts yet.</p>
          ) : (
            posts.map((p) => <ProfilePostCard key={p._id} post={p} />)
          )
        )}

        {tab === 'cafes' && (
          cafes.length === 0 ? (
            <p className="pf-empty">No cafes added yet.</p>
          ) : (
            cafes.map((c) => <ProfileCafeCard key={c._id} cafe={c} />)
          )
        )}

        {tab === 'liked' && (
          likedPosts.length === 0 ? (
            <p className="pf-empty">No liked posts yet.</p>
          ) : (
            likedPosts.map((p) => <ProfilePostCard key={p._id} post={p} />)
          )
        )}
      </div>
    </div>
  );
}
