import PropTypes from 'prop-types';
import CommentItem from './CommentItem';
import './CommentList.css';

export default function CommentList({ comments, meId, onUpdate, onDelete }) {
  if (!comments.length) {
    return <p className="commentEmpty">No comments yet.</p>;
  }

  return (
    <div className="commentList">
      {comments.map((c) => (
        <CommentItem
          key={String(c._id)}
          comment={c}
          isOwner={Boolean(meId && c.userId && String(c.userId) === String(meId))}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

CommentList.propTypes = {
  comments: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
      text: PropTypes.string.isRequired,
      authorUsername: PropTypes.string,
      createdAt: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.instanceOf(Date),
      ]),
      userId: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    }),
  ).isRequired,
  meId: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
