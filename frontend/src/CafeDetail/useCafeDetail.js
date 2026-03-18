import { useCallback, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuth } from '../auth/useAuth';
import { useToast } from '../toast/useToast';

const POSTS_PER_PAGE = 10;

export default function useCafeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { me, isLoggedIn } = useAuth();
  const toast = useToast();
  const formRef = useRef(null);
  const reviewTextRef = useRef(null);

  const [cafe, setCafe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  const [posts, setPosts] = useState([]);
  const [postsPage, setPostsPage] = useState(1);
  const [postsTotal, setPostsTotal] = useState(0);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);

  const [formData, setFormData] = useState({
    author: '',
    text: '',
    photoUrl: '',
    rating: '5',
  });

  // --- Fetch cafe + initial posts ---
  useEffect(() => {
    let cancelled = false;

    apiFetch(`/api/cafes/${id}`)
      .then((data) => {
        if (!cancelled) setCafe(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    (async () => {
      try {
        const data = await apiFetch(`/api/cafes/${id}/posts?page=1&limit=${POSTS_PER_PAGE}`);
        if (!cancelled) {
          setPosts(Array.isArray(data.posts) ? data.posts : []);
          setPostsTotal(data.total || 0);
          setPostsPage(1);
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // --- Posts ---
  const reloadPosts = useCallback(async () => {
    try {
      const data = await apiFetch(`/api/cafes/${id}/posts?page=1&limit=${POSTS_PER_PAGE}`);
      setPosts(Array.isArray(data.posts) ? data.posts : []);
      setPostsTotal(data.total || 0);
      setPostsPage(1);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  }, [id]);

  const loadMorePosts = async () => {
    const nextPage = postsPage + 1;
    setLoadingMorePosts(true);
    try {
      const data = await apiFetch(`/api/cafes/${id}/posts?page=${nextPage}&limit=${POSTS_PER_PAGE}`);
      const newPosts = Array.isArray(data.posts) ? data.posts : [];
      setPosts((prev) => [...prev, ...newPosts]);
      setPostsTotal(data.total || 0);
      setPostsPage(nextPage);
    } catch (err) {
      console.error('Error loading more posts:', err);
    } finally {
      setLoadingMorePosts(false);
    }
  };

  // --- Review form ---
  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cafeId: id,
          author: formData.author,
          text: formData.text,
          photoUrl: formData.photoUrl,
          rating: formData.rating,
        }),
      });
      setFormData({ author: '', text: '', photoUrl: '', rating: '5' });
      reloadPosts();
    } catch (err) {
      console.error(err);
      toast.error('Error creating post: ' + err.message);
    }
  };

  const setRating = (star) => {
    setFormData((prev) => ({ ...prev, rating: String(star) }));
  };

  // --- Delete cafe ---
  const handleDelete = async () => {
    const isConfirmed = await toast.confirm(
      'Are you sure you want to delete this cafe? This action cannot be undone.',
      'Delete Cafe',
    );
    if (!isConfirmed) return;

    try {
      await apiFetch(`/api/cafes/${id}`, { method: 'DELETE' });
      toast.success('Cafe deleted successfully!');
      navigate('/');
    } catch (err) {
      toast.error('Error deleting: ' + err.message);
    }
  };

  // --- Edit cafe ---
  const startEditing = () => {
    setEditData({
      name: cafe.name,
      address: cafe.address,
      has_good_wifi: cafe.has_good_wifi,
      is_quiet: cafe.is_quiet,
      rating: cafe.rating ?? '',
      cover_image: cafe.cover_image || '',
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/cafes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      setCafe((prev) => ({ ...prev, ...editData }));
      setIsEditing(false);
    } catch (err) {
      toast.error('Error updating cafe: ' + err.message);
    }
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // --- Scroll to review form ---
  const scrollToForm = () => {
    if (reviewTextRef.current) {
      reviewTextRef.current.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => reviewTextRef.current?.focus(), 400);
    }
  };

  const isOwner = me && cafe && cafe.createdBy && String(me._id) === String(cafe.createdBy);

  return {
    // Cafe data
    cafe,
    loading,
    error,

    // Owner actions
    isOwner,
    handleDelete,

    // Edit
    isEditing,
    editData,
    startEditing,
    cancelEditing,
    handleEditSubmit,
    handleEditChange,

    // Posts / reviews
    posts,
    postsTotal,
    loadingMorePosts,
    loadMorePosts,

    // Review form
    formData,
    handleReviewChange,
    handleReviewSubmit,
    setRating,
    formRef,
    reviewTextRef,

    // Auth
    isLoggedIn,
    me,

    // Scroll
    scrollToForm,
  };
}
