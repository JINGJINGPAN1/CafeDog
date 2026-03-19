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

  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [editCoverFile, setEditCoverFile] = useState(null);

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
  const [postPhotoFile, setPostPhotoFile] = useState(null);

  const uploadImage = useCallback(async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const data = await apiFetch('/api/uploads/image', { method: 'POST', body: fd });
    return data?.url;
  }, []);

  // --- Fetch cafe + initial posts ---
  useEffect(() => {
    let cancelled = false;

    apiFetch(`/api/cafes/${id}`)
      .then((data) => {
        if (!cancelled) {
          const normalized = {
            ...data,
            likesCount: data?.likesCount ?? 0,
            viewerHasLiked: Boolean(data?.viewerHasLiked),
            viewerHasSaved: Boolean(data?.viewerHasSaved),
          };
          setCafe(normalized);
        }
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

  const togglePostLike = useCallback(async (postId) => {
    if (!isLoggedIn) {
      toast.error('Please log in to like this post.');
      return;
    }
    if (!postId) return;

    const current = posts.find((p) => String(p._id) === String(postId));
    const hasLiked = Boolean(current?.viewerHasLiked);

    try {
      const data = await apiFetch(`/api/posts/${postId}/likes`, { method: hasLiked ? 'DELETE' : 'POST' });
      setPosts((prev) => prev.map((p) => {
        if (String(p._id) !== String(postId)) return p;
        return {
          ...p,
          likesCount: data?.count ?? p.likesCount ?? 0,
          viewerHasLiked: Boolean(data?.viewerHasLiked),
        };
      }));
    } catch (err) {
      toast.error('Error updating post like: ' + (err instanceof Error ? err.message : String(err)));
    }
  }, [isLoggedIn, posts, toast]);

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

  const deletePost = useCallback(async (postId) => {
    if (!isLoggedIn) {
      toast.error('Please log in.');
      return;
    }
    const ok = await toast.confirm('Delete this post? This cannot be undone.', 'Delete post');
    if (!ok) return;

    try {
      await apiFetch(`/api/posts/${postId}`, { method: 'DELETE' });
      setPosts((prev) => prev.filter((p) => String(p._id) !== String(postId)));
      setPostsTotal((n) => Math.max(0, (Number(n) || 0) - 1));
      toast.success('Post deleted.');
    } catch (err) {
      toast.error('Error deleting post: ' + (err instanceof Error ? err.message : String(err)));
    }
  }, [isLoggedIn, toast]);

  const updatePost = useCallback(async (postId, updates) => {
    if (!isLoggedIn) {
      toast.error('Please log in.');
      return;
    }
    try {
      const payload = {
        text: updates?.text,
        photoUrl: updates?.photoUrl,
        rating: updates?.rating,
      };
      await apiFetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setPosts((prev) => prev.map((p) => {
        if (String(p._id) !== String(postId)) return p;
        return {
          ...p,
          text: String(payload.text),
          photoUrl: payload.photoUrl != null ? String(payload.photoUrl) : '',
          rating: payload.rating != null && payload.rating !== '' ? Number(payload.rating) : p.rating,
          updatedAt: new Date().toISOString(),
        };
      }));
      toast.success('Post updated.');
    } catch (err) {
      toast.error('Error updating post: ' + (err instanceof Error ? err.message : String(err)));
    }
  }, [isLoggedIn, toast]);

  const bumpPostRepliesCount = useCallback((postId, delta) => {
    setPosts((prev) => prev.map((p) => {
      if (String(p._id) !== String(postId)) return p;
      const next = (p.repliesCount ?? 0) + (Number(delta) || 0);
      return { ...p, repliesCount: Math.max(0, next) };
    }));
  }, []);

  // --- Review form ---
  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      let photoUrl = formData.photoUrl;
      if (postPhotoFile) {
        const uploadedUrl = await uploadImage(postPhotoFile);
        if (uploadedUrl) photoUrl = uploadedUrl;
      }
      await apiFetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cafeId: id,
          author: formData.author,
          text: formData.text,
          photoUrl,
          rating: formData.rating,
        }),
      });
      setFormData({ author: '', text: '', photoUrl: '', rating: '5' });
      setPostPhotoFile(null);
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
    setEditCoverFile(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditCoverFile(null);
    setIsEditing(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      let coverUrl = editData.cover_image;
      if (editCoverFile) {
        const uploadedUrl = await uploadImage(editCoverFile);
        if (uploadedUrl) coverUrl = uploadedUrl;
      }
      const payload = { ...editData, cover_image: coverUrl };
      await apiFetch(`/api/cafes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setCafe((prev) => ({ ...prev, ...payload }));
      setEditCoverFile(null);
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
    setIsReviewFormOpen(true);

    let tries = 0;
    const tryScrollAndFocus = () => {
      if (reviewTextRef.current) {
        reviewTextRef.current.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => reviewTextRef.current?.focus(), 250);
        return;
      }
      tries += 1;
      if (tries >= 12) return;
      setTimeout(tryScrollAndFocus, 50);
    };
    setTimeout(tryScrollAndFocus, 0);
  };

  const isOwner = me && cafe && cafe.createdBy && String(me._id) === String(cafe.createdBy);

  // --- Like / Save ---
  const toggleLike = useCallback(async () => {
    if (!isLoggedIn) {
      toast.error('Please log in to like this cafe.');
      return;
    }
    if (!cafe) return;

    const hasLiked = Boolean(cafe.viewerHasLiked);
    try {
      const data = await apiFetch(`/api/cafes/${id}/likes`, { method: hasLiked ? 'DELETE' : 'POST' });
      setCafe((prev) => prev ? ({
        ...prev,
        likesCount: data?.count ?? prev.likesCount ?? 0,
        viewerHasLiked: Boolean(data?.viewerHasLiked),
      }) : prev);
    } catch (err) {
      toast.error('Error updating like: ' + (err instanceof Error ? err.message : String(err)));
    }
  }, [cafe, id, isLoggedIn, toast]);

  const toggleSave = useCallback(async () => {
    if (!isLoggedIn) {
      toast.error('Please log in to save this cafe.');
      return;
    }
    if (!cafe) return;

    const hasSaved = Boolean(cafe.viewerHasSaved);
    try {
      const data = await apiFetch(`/api/cafes/${id}/saved`, { method: hasSaved ? 'DELETE' : 'POST' });
      setCafe((prev) => prev ? ({
        ...prev,
        savesCount: data?.savesCount ?? prev.savesCount ?? 0,
        viewerHasSaved: Boolean(data?.viewerHasSaved),
      }) : prev);
    } catch (err) {
      toast.error('Error updating saved: ' + (err instanceof Error ? err.message : String(err)));
    }
  }, [cafe, id, isLoggedIn, toast]);

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
    editCoverFile,
    setEditCoverFile,

    // Posts / reviews
    posts,
    postsTotal,
    loadingMorePosts,
    loadMorePosts,
    togglePostLike,
    deletePost,
    updatePost,
    bumpPostRepliesCount,

    // Review form
    formData,
    handleReviewChange,
    handleReviewSubmit,
    setRating,
    postPhotoFile,
    setPostPhotoFile,
    formRef,
    reviewTextRef,
    isReviewFormOpen,
    setIsReviewFormOpen,

    // Auth
    isLoggedIn,
    me,

    // Scroll
    scrollToForm,

    // Cafe actions
    toggleLike,
    toggleSave,
  };
}
