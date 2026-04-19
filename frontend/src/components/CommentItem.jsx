import { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './CommentItem.module.css';

export default function CommentItem({ comment, isOwner, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.text || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const startEdit = () => {
    setText(comment.text || '');
    setError('');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError('');
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await onUpdate(comment._id, text);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.commentItem}>
      <div className={styles.commentHeader}>
        <div className={styles.commentAuthor}>{comment.authorUsername || 'User'}</div>
        <div className={styles.commentMeta}>
          {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : null}
        </div>
      </div>

      {editing ? (
        <div className={styles.commentEdit}>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} />
          {error ? <div className={styles.commentError}>{error}</div> : null}
          <div className={styles.commentActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={cancelEdit}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="button" className={styles.primaryButton} onClick={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.commentBody}>
          <p>{comment.text}</p>
          {isOwner ? (
            <div className={styles.commentActions}>
              <button type="button" className={styles.linkButton} onClick={startEdit}>
                Edit
              </button>
              <button
                type="button"
                className={`${styles.linkButton} ${styles.danger}`}
                onClick={() => onDelete(comment._id)}
              >
                Delete
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

CommentItem.propTypes = {
  comment: PropTypes.shape({
    _id: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
    text: PropTypes.string.isRequired,
    createdAt: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.instanceOf(Date),
    ]),
    authorUsername: PropTypes.string,
    userId: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  }).isRequired,
  isOwner: PropTypes.bool.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
