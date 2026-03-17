import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { apiFetch } from '../lib/api';
import { useAuth } from '../auth/useAuth';
import CommentForm from './CommentForm';
import CommentList from './CommentList';
import './CommentSection.css';

export default function CommentSection({ postId }) {
  const { me, isLoggedIn } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/api/posts/${postId}/comments`);
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  const createComment = useCallback(
    async (text) => {
      await apiFetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      await load();
    },
    [postId, load],
  );

  const updateComment = useCallback(
    async (commentId, text) => {
      await apiFetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      await load();
    },
    [load],
  );

  const deleteComment = useCallback(
    async (commentId) => {
      await apiFetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      await load();
    },
    [load],
  );

  return (
    <div className="commentSection">
      <div className="commentSectionHeader">
        <h4>Comments</h4>
        <button type="button" className="linkButton" onClick={load}>
          Refresh
        </button>
      </div>

      <CommentForm disabled={!isLoggedIn} onSubmit={createComment} />

      {loading ? <p className="commentStatus">Loading comments…</p> : null}
      {error ? <p className="commentError">{error}</p> : null}

      <CommentList
        comments={comments}
        meId={me?._id}
        onUpdate={updateComment}
        onDelete={deleteComment}
      />
    </div>
  );
}

CommentSection.propTypes = {
  postId: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
};
