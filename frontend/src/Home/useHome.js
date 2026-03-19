import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../auth/useAuth';
import { useToast } from '../toast/useToast';
import { apiFetch } from '../lib/api';

const CAFES_PER_PAGE = 10;
const CATEGORIES = ['discover', 'new places', 'top rated'];

export default function useHome() {
  const { me, isLoggedIn, logout } = useAuth();
  const toast = useToast();

  const [cafes, setCafes] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWifi, setFilterWifi] = useState(false);
  const [filterQuiet, setFilterQuiet] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    has_good_wifi: false,
    is_quiet: false,
    rating: '',
    cover_image: '',
  });
  const [coverFile, setCoverFile] = useState(null);

  const [activeTab, setActiveTab] = useState('discover');
  const debounceRef = useRef(null);
  const hasLoadedOnce = useRef(false);

  const fetchCafes = useCallback((search, wifi, quiet, tab, pg, reset) => {
    if (reset) {
      if (!hasLoadedOnce.current) setInitialLoading(true);
      else setSearching(true);
    } else {
      setLoadingMore(true);
    }

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (wifi) params.append('wifi', 'true');
    if (quiet) params.append('quiet', 'true');
    if (tab === 'new places') params.append('sort', 'new');
    if (tab === 'top rated') params.append('sort', 'top');
    params.append('page', String(pg));
    params.append('limit', String(CAFES_PER_PAGE));

    fetch(`/api/cafes?${params.toString()}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (reset) {
          setCafes(data.cafes);
        } else {
          setCafes((prev) => [...prev, ...data.cafes]);
        }
        setTotal(data.total);
        setPage(pg);
        hasLoadedOnce.current = true;
        setInitialLoading(false);
        setSearching(false);
        setLoadingMore(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setInitialLoading(false);
        setSearching(false);
        setLoadingMore(false);
      });
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchCafes(searchTerm, filterWifi, filterQuiet, activeTab, 1, true);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, filterWifi, filterQuiet, activeTab, fetchCafes]);

  const handleLoadMore = () => {
    fetchCafes(searchTerm, filterWifi, filterQuiet, activeTab, page + 1, false);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.address) {
      toast.error('Name and address are required!');
      return;
    }
    try {
      let coverUrl = formData.cover_image;
      if (coverFile) {
        const fd = new FormData();
        fd.append('file', coverFile);
        const uploaded = await apiFetch('/api/uploads/image', { method: 'POST', body: fd });
        coverUrl = uploaded?.url || coverUrl;
      }

      await apiFetch('/api/cafes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cover_image: coverUrl,
          rating: Number(formData.rating),
        }),
      });
      toast.success('Cafe successfully published!');
      setFormData({
        name: '',
        address: '',
        has_good_wifi: false,
        is_quiet: false,
        rating: '',
        cover_image: '',
      });
      setCoverFile(null);
      setShowForm(false);
      fetchCafes(searchTerm, filterWifi, filterQuiet, activeTab, 1, true);
    } catch (err) {
      toast.error('Error submitting: ' + err.message);
    }
  };

  const openForm = () => {
    setCoverFile(null);
    setShowForm(true);
  };
  const closeForm = () => {
    setCoverFile(null);
    setShowForm(false);
  };
  const toggleWifi = () => setFilterWifi((v) => !v);
  const toggleQuiet = () => setFilterQuiet((v) => !v);

  const initials = me?.username
    ? me.username.slice(0, 2).toUpperCase()
    : me?.email
      ? me.email.slice(0, 2).toUpperCase()
      : 'CD';

  return {
    cafes,
    initialLoading,
    searching,
    loadingMore,
    error,
    total,
    searchTerm,
    setSearchTerm,
    filterWifi,
    toggleWifi,
    filterQuiet,
    toggleQuiet,
    activeTab,
    setActiveTab,
    categories: CATEGORIES,
    showForm,
    openForm,
    closeForm,
    formData,
    handleFormChange,
    handleFormSubmit,
    coverFile,
    setCoverFile,
    handleLoadMore,
    me,
    isLoggedIn,
    logout,
    initials,
  };
}
