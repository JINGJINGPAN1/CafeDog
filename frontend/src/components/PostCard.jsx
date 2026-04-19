import PropTypes from 'prop-types';
import LikeButton from './LikeButton';
import CommentSection from './CommentSection';
import styles from './PostCard.module.css';

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { apiFetch } from '../lib/api';
import { useToast } from '../toast/useToast';

export default function PostCard({ post, onUpdate, onDelete }) {
  const { me } = useAuth();
  const toast = useToast();
  const isOwner = me && post.authorId && String(me._id) === String(post.authorId);

  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.text);
  const [editPhotoUrl, setEditPhotoUrl] = useState(post.photoUrl || '');
  const [editRating, setEditRating] = useState(String(post.rating || 5));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/posts/${post._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editText, photoUrl: editPhotoUrl, rating: editRating }),
      });
      if (onUpdate) onUpdate();
      setEditing(false);
    } catch (err) {
      toast.error('Error updating post: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await toast.confirm('Delete this post?', 'Delete Post');
    if (!confirmed) return;
    try {
      await apiFetch(`/api/posts/${post._id}`, { method: 'DELETE' });
      if (onDelete) onDelete();
    } catch (err) {
      toast.error('Error deleting post: ' + err.message);
    }
  };

  return (
    <div className={styles.postCard}>
      <div className={styles.postHeader}>
        <strong className={styles.postAuthor}>
          👤{' '}
          {post.authorId ? (
            <Link to={`/profile/${post.authorId}`} className={styles.authorLink}>
              {post.author}
            </Link>
          ) : (
            post.author
          )}
        </strong>
        <span className={styles.postRating}>{'⭐️'.repeat(Number(post.rating) || 0)}</span>
      </div>

      {editing ? (
        <div className={styles.postEditForm}>
          <textarea
            className={styles.textarea}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            required
          />
          <input
            className={styles.input}
            value={editPhotoUrl}
            onChange={(e) => setEditPhotoUrl(e.target.value)}
            placeholder="Photo URL (optional)"
          />
          <select
            className={styles.select}
            value={editRating}
            onChange={(e) => setEditRating(e.target.value)}
          >
            <option value="5">⭐️⭐️⭐️⭐️⭐️ (5)</option>
            <option value="4">⭐️⭐️⭐️⭐️ (4)</option>
            <option value="3">⭐️⭐️⭐️ (3)</option>
            <option value="2">⭐️⭐️ (2)</option>
            <option value="1">⭐️ (1)</option>
          </select>
          <div className={styles.buttonRow}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className={styles.postText}>{post.text}</p>
          {post.photoUrl ? (
            <img className={styles.postPhoto} src={post.photoUrl} alt="Post attachment" />
          ) : null}
        </>
      )}

      <small className={styles.postMeta}>
        Posted on: {new Date(post.createdAt || post.createAt).toLocaleDateString()}
      </small>

      <div className={styles.postActions}>
        <LikeButton postId={post._id} />
        {isOwner && !editing ? (
          <>
            <button type="button" className={styles.linkButton} onClick={() => setEditing(true)}>
              Edit
            </button>
            <button
              type="button"
              className={`${styles.linkButton} ${styles.danger}`}
              onClick={handleDelete}
            >
              Delete
            </button>
          </>
        ) : null}
      </div>

      <CommentSection postId={post._id} />
    </div>
  );
}

PostCard.propTypes = {
  post: PropTypes.shape({
    _id: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
    author: PropTypes.string.isRequired,
    authorId: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
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
  onUpdate: PropTypes.func,
  onDelete: PropTypes.func,
};
