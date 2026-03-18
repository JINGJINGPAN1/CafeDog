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

function ProfilePostCard({ post, index }) {
  const isOdd = index % 2 === 1;
  return (
    <Link to={`/cafe/${post.cafeId}`} className="pf-card">
      <div className="pf-card-img-wrap">
        {post.photoUrl ? (
          <img className="pf-card-img" src={post.photoUrl} alt="Post" />
        ) : (
          <div className={`pf-card-img-ph ${isOdd ? 'pf-card-img-ph--alt' : ''}`}>&#9749;</div>
        )}
      </div>
      <div className="pf-card-body">
        {post.cafeName ? <span className="pf-card-cafe">{post.cafeName}</span> : null}
        <p className="pf-card-text">{post.text}</p>
        <div className="pf-card-foot">
          <span className="pf-card-stars">{renderStars(post.rating)}</span>
          <span className="pf-card-date">
            {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}
          </span>
        </div>
      </div>
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
    cafeName: PropTypes.string,
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  }).isRequired,
  index: PropTypes.number.isRequired,
};

function ProfileCafeCard({ cafe, index }) {
  const isOdd = index % 2 === 1;
  return (
    <Link to={`/cafe/${cafe._id}`} className="pf-card">
      <div className="pf-card-img-wrap">
        {cafe.cover_image ? (
          <img className="pf-card-img" src={cafe.cover_image} alt={cafe.name} />
        ) : (
          <div className={`pf-card-img-ph ${isOdd ? 'pf-card-img-ph--alt' : ''}`}>&#9749;</div>
        )}
      </div>
      <div className="pf-card-body">
        <span className="pf-cafe-name">{cafe.name}</span>
        {cafe.address ? <span className="pf-cafe-addr">{cafe.address}</span> : null}
        <div className="pf-cafe-badges">
          {cafe.has_good_wifi ? <span className="pf-cafe-pill pf-cafe-pill--wifi">wifi</span> : null}
          {cafe.is_quiet ? <span className="pf-cafe-pill pf-cafe-pill--quiet">quiet</span> : null}
          {cafe.rating ? <span className="pf-cafe-pill pf-cafe-pill--rating">{renderStars(cafe.rating)}</span> : null}
        </div>
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
    has_good_wifi: PropTypes.bool,
    is_quiet: PropTypes.bool,
  }).isRequired,
  index: PropTypes.number.isRequired,
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
      {/* 1. Navbar */}
      <header className="pf-nav">
        <span className="pf-logo"><span className="pf-logo-cafe">caf&eacute;</span><span className="pf-logo-dog">dog</span></span>
        <Link to="/" className="pf-back">&larr; back to home</Link>
      </header>

      <div className="pf-section">
        {/* 2. Profile header */}
        <div className="pf-header">
          <div className="pf-avatar">{getInitials(user.username)}</div>
          <div className="pf-info">
            <div className="pf-name-row">
              <h1 className="pf-name">{user.username}</h1>
              {isSelf ? <span className="pf-badge">You</span> : null}
            </div>
            <p className="pf-email">{user.email}</p>
            <p className="pf-joined">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
            {user.bio ? <p className="pf-bio">{user.bio}</p> : null}
          </div>
          <button type="button" className="pf-edit-btn">Edit Profile</button>
        </div>

        {/* 3. Stats row */}
        <div className="pf-stats">
          <div className="pf-stat">
            <span className="pf-stat-n">{posts.length}</span>
            <span className="pf-stat-l">posts</span>
          </div>
          <div className="pf-stat pf-stat--mid">
            <span className="pf-stat-n">{cafes.length}</span>
            <span className="pf-stat-l">caf&eacute;s added</span>
          </div>
          <div className="pf-stat">
            <span className="pf-stat-n">{likedPosts.length}</span>
            <span className="pf-stat-l">likes</span>
          </div>
        </div>

        {/* 4. Tab bar */}
        <div className="pf-tabs">
          <button type="button" className={`pf-tab ${tab === 'posts' ? 'pf-tab--on' : ''}`} onClick={() => setTab('posts')}>Posts</button>
          <button type="button" className={`pf-tab ${tab === 'cafes' ? 'pf-tab--on' : ''}`} onClick={() => setTab('cafes')}>Caf&eacute;s Added</button>
          <button type="button" className={`pf-tab ${tab === 'liked' ? 'pf-tab--on' : ''}`} onClick={() => setTab('liked')}>Liked Posts</button>
        </div>

        {/* 5. Content grid */}
        <div className="pf-grid">
          {tab === 'posts' && (
            posts.length === 0 ? (
              <div className="pf-empty"><span className="pf-empty-icon">&#9749;</span><p>No posts yet.</p></div>
            ) : (
              posts.map((p, i) => <ProfilePostCard key={p._id} post={p} index={i} />)
            )
          )}

          {tab === 'cafes' && (
            cafes.length === 0 ? (
              <div className="pf-empty"><span className="pf-empty-icon">&#9749;</span><p>No caf&eacute;s added yet.</p></div>
            ) : (
              cafes.map((c, i) => <ProfileCafeCard key={c._id} cafe={c} index={i} />)
            )
          )}

          {tab === 'liked' && (
            likedPosts.length === 0 ? (
              <div className="pf-empty"><span className="pf-empty-icon">&#9749;</span><p>No liked posts yet.</p></div>
            ) : (
              likedPosts.map((p, i) => <ProfilePostCard key={p._id} post={p} index={i} />)
            )
          )}
        </div>
      </div>
    </div>
  );
}
