import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './CafeDetail.module.css';
import { apiFetch } from '../lib/api';
import { useAuth } from '../auth/useAuth';
import { useToast } from '../toast/useToast';

const AVATAR_THEMES = [
  { bg: '#F5C4B3', color: '#712B13' },
  { bg: '#E1F5EE', color: '#085041' },
  { bg: '#EEEDFE', color: '#3C3489' },
  { bg: '#FDE8E8', color: '#9B1C1C' },
  { bg: '#E1EFFE', color: '#1E429F' },
  { bg: '#FEF3C7', color: '#92400E' },
  { bg: '#D1FAE5', color: '#065F46' },
];

function hashUsername(name) {
  if (!name) return 0;
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

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

function renderStars(n) {
  const count = Number(n) || 0;
  let s = '';
  for (let i = 0; i < 5; i++) s += i < count ? '\u2605' : '\u2606';
  return s;
}

function HeartIcon({ active }) {
  const stroke = active ? '#eb5757' : '#ccc';
  const fill = active ? '#eb5757' : 'none';
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill={fill}
      stroke={stroke}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export default function ReviewCard({ post, index, onToggleLike, onDeletePost, onUpdatePost, onBumpRepliesCount }) {
  const theme = AVATAR_THEMES[hashUsername(post.author) % AVATAR_THEMES.length];
  const liked = Boolean(post.viewerHasLiked);
  const likesCount = post.likesCount ?? 0;
  const initialRepliesCount = post.repliesCount ?? 0;
  const toast = useToast();
  const { isLoggedIn, me } = useAuth();

  const postId = useMemo(() => String(post._id || ''), [post._id]);
  const isPostOwner =
    Boolean(me?._id) && Boolean(post.authorId) && String(post.authorId) === String(me._id);

  const [replyOpen, setReplyOpen] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replies, setReplies] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [deletingReplyId, setDeletingReplyId] = useState(null);

  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editText, setEditText] = useState(String(post.text || ''));
  const [editPhotoUrl, setEditPhotoUrl] = useState(String(post.photoUrl || ''));
  const [editRating, setEditRating] = useState(String(post.rating ?? 5));

  useEffect(() => {
    if (isEditingPost) return;
    setEditText(String(post.text || ''));
    setEditPhotoUrl(String(post.photoUrl || ''));
    setEditRating(String(post.rating ?? 5));
  }, [isEditingPost, post.text, post.photoUrl, post.rating]);

  const loadReplies = useCallback(async () => {
    if (!postId) return;
    setLoadingReplies(true);
    try {
      const list = await apiFetch(`/api/posts/${postId}/comments`);
      setReplies(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error('Error loading replies: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoadingReplies(false);
    }
  }, [postId, toast]);

  useEffect(() => {
    if (!replyOpen) return;
    if (replies != null) return;
    loadReplies();
  }, [replyOpen, replies, loadReplies]);

  const toggleReplyOpen = () => setReplyOpen((v) => !v);

  const canSubmitReply = Boolean(String(replyText).trim()) && !submittingReply;

  const submitReply = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error('Please log in to reply.');
      return;
    }
    if (!postId) return;
    const text = String(replyText).trim();
    if (!text) return;

    setSubmittingReply(true);
    try {
      const created = await apiFetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      setReplies((prev) => (Array.isArray(prev) ? [created, ...prev] : [created]));
      setReplyText('');
      onBumpRepliesCount?.(postId, +1);
    } catch (err) {
      toast.error('Error replying: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmittingReply(false);
    }
  };

  const deleteReply = async (commentId) => {
    if (!isLoggedIn) {
      toast.error('Please log in.');
      return;
    }
    const ok = await toast.confirm('Delete this reply? This cannot be undone.', 'Delete reply');
    if (!ok) return;

    setDeletingReplyId(String(commentId));
    try {
      await apiFetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      setReplies((prev) =>
        Array.isArray(prev) ? prev.filter((r) => String(r._id) !== String(commentId)) : prev,
      );
      onBumpRepliesCount?.(postId, -1);
    } catch (err) {
      toast.error('Error deleting reply: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDeletingReplyId(null);
    }
  };

  const repliesCountForDisplay = useMemo(() => {
    if (Array.isArray(replies)) return replies.length;
    return initialRepliesCount;
  }, [replies, initialRepliesCount]);

  const startEditPost = () => setIsEditingPost(true);
  const cancelEditPost = () => setIsEditingPost(false);
  const canSavePost = Boolean(String(editText).trim());

  const savePost = async (e) => {
    e.preventDefault();
    const text = String(editText).trim();
    if (!text) return;
    await onUpdatePost?.(postId, {
      text,
      photoUrl: String(editPhotoUrl || ''),
      rating: Number(editRating),
    });
    setIsEditingPost(false);
  };

  return (
    <div className={styles.cdRv}>
      <div className={styles.cdRvHead}>
        <div className={styles.cdRvLeft}>
          <span className={styles.cdAv} style={{ background: theme.bg, color: theme.color }}>
            {getInitials(post.author)}
          </span>
          <div>
            <div className={styles.cdRvAuthor}>
              {post.authorId ? (
                <Link to={`/profile/${post.authorId}`} className={styles.cdRvAuthorLink}>
                  {post.author}
                </Link>
              ) : (
                post.author
              )}
            </div>
            <div className={styles.cdRvTime}>{timeAgo(post.createdAt || post.createAt)}</div>
          </div>
        </div>
        <span className={styles.cdRvStars}>{renderStars(post.rating)}</span>
      </div>

      {isEditingPost ? (
        <form className={styles.cdPostEdit} onSubmit={savePost}>
          <textarea
            className={`${styles.cdReplyInput} ${styles.cdPostEditTa}`}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="Edit your post…"
          />
          <div className={styles.cdPostEditRow}>
            <input
              className={styles.cdReplyInput}
              value={editPhotoUrl}
              onChange={(e) => setEditPhotoUrl(e.target.value)}
              placeholder="Photo URL (optional)"
            />
            <select
              className={styles.cdPostEditSelect}
              value={editRating}
              onChange={(e) => setEditRating(e.target.value)}
            >
              <option value="1">1★</option>
              <option value="2">2★</option>
              <option value="3">3★</option>
              <option value="4">4★</option>
              <option value="5">5★</option>
            </select>
          </div>
          <div className={styles.cdPostEditActions}>
            <button
              type="button"
              className={`${styles.cdPostEditGhost} ${styles.cdBarBtn}`}
              onClick={cancelEditPost}
            >
              Cancel
            </button>
            <button type="submit" className={styles.cdPostEditSave} disabled={!canSavePost}>
              Save
            </button>
          </div>
        </form>
      ) : (
        <>
          <p className={styles.cdRvText}>{post.text}</p>
          {post.photoUrl ? (
            <img className={styles.cdRvPhoto} src={post.photoUrl} alt="review" />
          ) : null}
        </>
      )}

      <div className={styles.cdRvFoot}>
        {isPostOwner ? (
          <>
            <button
              type="button"
              className={`${styles.cdRvReply} ${styles.cdBarBtn}`}
              onClick={startEditPost}
              disabled={isEditingPost}
            >
              edit
            </button>
            <button
              type="button"
              className={`${styles.cdRvReply} ${styles.cdRvDanger} ${styles.cdBarBtn}`}
              onClick={() => onDeletePost?.(postId)}
              disabled={isEditingPost}
            >
              delete
            </button>
          </>
        ) : null}
        <button
          type="button"
          className={`${styles.cdRvAct} ${styles.cdBarBtn}`}
          onClick={() => onToggleLike?.(post._id)}
          aria-pressed={liked}
          disabled={isEditingPost}
        >
          <HeartIcon active={liked} /> {likesCount}
        </button>
        <button
          type="button"
          className={`${styles.cdRvReply} ${styles.cdBarBtn}`}
          onClick={toggleReplyOpen}
          aria-expanded={replyOpen}
          disabled={isEditingPost}
        >
          reply
          {repliesCountForDisplay > 0 ? (
            <span className={styles.cdReplyCount}>{repliesCountForDisplay}</span>
          ) : null}
        </button>
      </div>

      {replyOpen ? (
        <div className={styles.cdReplies}>
          <div className={styles.cdRepliesTop}>
            <span className={styles.cdRepliesTitle}>Replies</span>
            <button
              type="button"
              className={`${styles.cdRepliesRefresh} ${styles.cdBarBtn}`}
              onClick={loadReplies}
              disabled={loadingReplies}
            >
              {loadingReplies ? 'Loading…' : 'Refresh'}
            </button>
          </div>

          {replies == null || loadingReplies ? (
            <div className={styles.cdRepliesEmpty}>Loading replies…</div>
          ) : replies.length === 0 ? (
            <div className={styles.cdRepliesEmpty}>No replies yet.</div>
          ) : (
            <div className={styles.cdRepliesList}>
              {replies.map((r) => (
                <div key={r._id} className={styles.cdReply}>
                  <div className={styles.cdReplyHead}>
                    <span className={styles.cdReplyAuthor}>
                      {r.authorUsername ||
                        (String(r.userId) === String(me?._id)
                          ? me?.username || me?.email || 'You'
                          : 'User')}
                    </span>
                    <span className={styles.cdReplyHeadRight}>
                      <span className={styles.cdReplyTime}>{timeAgo(r.createdAt)}</span>
                      {String(r.userId) === String(me?._id) ? (
                        <button
                          type="button"
                          className={`${styles.cdReplyDel} ${styles.cdBarBtn}`}
                          onClick={() => deleteReply(r._id)}
                          disabled={deletingReplyId === String(r._id)}
                        >
                          {deletingReplyId === String(r._id) ? 'Deleting…' : 'Delete'}
                        </button>
                      ) : null}
                    </span>
                  </div>
                  <div className={styles.cdReplyText}>{r.text}</div>
                </div>
              ))}
            </div>
          )}

          <form className={styles.cdReplyForm} onSubmit={submitReply}>
            <input
              className={styles.cdReplyInput}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={isLoggedIn ? 'Write a reply…' : 'Log in to reply…'}
              disabled={!isLoggedIn || submittingReply}
            />
            <button
              type="submit"
              className={styles.cdReplyBtn}
              disabled={!isLoggedIn || !canSubmitReply}
            >
              {submittingReply ? 'Sending…' : 'Send'}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
