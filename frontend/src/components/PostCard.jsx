import PropTypes from 'prop-types';
import LikeButton from './LikeButton';
import CommentSection from './CommentSection';
import './PostCard.css';

export default function PostCard({ post }) {
  return (
    <div className="postCard">
      <div className="postHeader">
        <strong className="postAuthor">👤 {post.author}</strong>
        <span className="postRating">{'⭐️'.repeat(Number(post.rating) || 0)}</span>
      </div>

      <p className="postText">{post.text}</p>

      {post.photoUrl ? (
        <img className="postPhoto" src={post.photoUrl} alt="Post attachment" />
      ) : null}

      <small className="postMeta">
        Posted on: {new Date(post.createdAt || post.createAt).toLocaleDateString()}
      </small>

      <div className="postActions">
        <LikeButton postId={post._id} />
      </div>

      <CommentSection postId={post._id} />
    </div>
  );
}

PostCard.propTypes = {
  post: PropTypes.shape({
    _id: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
    author: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    photoUrl: PropTypes.string,
    createdAt: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.instanceOf(Date),
    ]),
    createAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  }).isRequired,
};
