import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { apiFetch } from '../lib/api';
import { useAuth } from '../auth/useAuth';
import './Profile.css';

function ProfilePostCard({ post }) {
  return (
    <Link to={`/cafe/${post.cafeId}`} className="profilePost">
      <div className="profilePostHeader">
        <span className="profilePostRating">
          {'⭐️'.repeat(Number(post.rating) || 0)}
        </span>
        <small className="profilePostDate">
          {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}
        </small>
      </div>
      <p className="profilePostText">{post.text}</p>
      {post.photoUrl ? (
        <img className="profilePostPhoto" src={post.photoUrl} alt="Post" />
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
    <Link to={`/cafe/${cafe._id}`} className="profileCafe">
      {cafe.cover_image ? (
        <img className="profileCafeImg" src={cafe.cover_image} alt={cafe.name} />
      ) : null}
      <div className="profileCafeInfo">
        <strong>{cafe.name}</strong>
        {cafe.rating ? <span className="profileCafeRating"> ⭐️ {cafe.rating}</span> : null}
        <p className="profileCafeAddress">{cafe.address}</p>
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

  if (loading) return <div className="page"><h2>Loading profile...</h2></div>;
  if (error) return <div className="page"><h2 className="errorText">Error: {error}</h2></div>;
  if (!profile) return <div className="page"><h2>User not found.</h2></div>;

  const { user, posts, cafes, likedPosts } = profile;

  return (
    <div className="page profilePage">
      <div className="profileTopBar">
        <Link to="/" className="backLink">&larr; Back to Home</Link>
      </div>

      <div className="profileHeader">
        <div className="profileAvatar">
          {(user.username || 'U').charAt(0).toUpperCase()}
        </div>
        <div className="profileMeta">
          <h1 className="profileName">
            {user.username}
            {isSelf ? <span className="profileBadge">You</span> : null}
          </h1>
          <p className="profileEmail">{user.email}</p>
          <p className="profileJoined">
            Joined {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="profileStats">
        <div className="profileStat">
          <strong>{posts.length}</strong>
          <span>Posts</span>
        </div>
        <div className="profileStat">
          <strong>{cafes.length}</strong>
          <span>Cafes Added</span>
        </div>
        <div className="profileStat">
          <strong>{likedPosts.length}</strong>
          <span>Likes</span>
        </div>
      </div>

      <div className="profileTabs">
        <button
          type="button"
          className={`profileTab ${tab === 'posts' ? 'active' : ''}`}
          onClick={() => setTab('posts')}
        >
          Posts
        </button>
        <button
          type="button"
          className={`profileTab ${tab === 'cafes' ? 'active' : ''}`}
          onClick={() => setTab('cafes')}
        >
          Cafes Added
        </button>
        <button
          type="button"
          className={`profileTab ${tab === 'liked' ? 'active' : ''}`}
          onClick={() => setTab('liked')}
        >
          Liked Posts
        </button>
      </div>

      <div className="profileContent">
        {tab === 'posts' && (
          posts.length === 0 ? (
            <p className="emptyMsg">No posts yet.</p>
          ) : (
            posts.map((p) => <ProfilePostCard key={p._id} post={p} />)
          )
        )}

        {tab === 'cafes' && (
          cafes.length === 0 ? (
            <p className="emptyMsg">No cafes added yet.</p>
          ) : (
            cafes.map((c) => <ProfileCafeCard key={c._id} cafe={c} />)
          )
        )}

        {tab === 'liked' && (
          likedPosts.length === 0 ? (
            <p className="emptyMsg">No liked posts yet.</p>
          ) : (
            likedPosts.map((p) => <ProfilePostCard key={p._id} post={p} />)
          )
        )}
      </div>
    </div>
  );
}
