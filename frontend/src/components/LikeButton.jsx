import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { apiFetch } from '../lib/api';
import { useAuth } from '../auth/useAuth';
import './LikeButton.css';

export default function LikeButton({ postId }) {
  const { isLoggedIn } = useAuth();
  const [count, setCount] = useState(0);
  const [viewerHasLiked, setViewerHasLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/posts/${postId}/likes`);
      setCount(Number(data?.count) || 0);
      setViewerHasLiked(Boolean(data?.viewerHasLiked));
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(async () => {
    if (!isLoggedIn) return;
    const method = viewerHasLiked ? 'DELETE' : 'POST';
    const data = await apiFetch(`/api/posts/${postId}/likes`, { method });
    setCount(Number(data?.count) || 0);
    setViewerHasLiked(Boolean(data?.viewerHasLiked));
  }, [isLoggedIn, viewerHasLiked, postId]);

  return (
    <button
      type="button"
      className={`likeButton ${viewerHasLiked ? 'liked' : ''}`}
      onClick={toggle}
      disabled={!isLoggedIn || loading}
      title={!isLoggedIn ? 'Log in to like' : undefined}
    >
      {viewerHasLiked ? 'Liked' : 'Like'} · {count}
    </button>
  );
}

LikeButton.propTypes = {
  postId: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
};
