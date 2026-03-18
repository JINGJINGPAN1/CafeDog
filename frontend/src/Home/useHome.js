import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../auth/useAuth';

const CAFES_PER_PAGE = 12;
const CATEGORIES = ['discover', 'wifi spots', 'quiet study', 'new places', 'top rated'];

export default function useHome() {
  const { me, isLoggedIn, logout } = useAuth();

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

  const [activeTab, setActiveTab] = useState('discover');
  const debounceRef = useRef(null);
  const hasLoadedOnce = useRef(false);

  const fetchCafes = useCallback((search, wifi, quiet, pg, reset) => {
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
      fetchCafes(searchTerm, filterWifi, filterQuiet, 1, true);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, filterWifi, filterQuiet, fetchCafes]);

  const handleLoadMore = () => {
    fetchCafes(searchTerm, filterWifi, filterQuiet, page + 1, false);
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
      alert('Name and address are required!');
      return;
    }
    try {
      const response = await fetch('/api/cafes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...formData, rating: Number(formData.rating) }),
      });
      if (!response.ok) throw new Error('Failed to save, backend returned an error');
      alert('Cafe successfully published!');
      setFormData({ name: '', address: '', has_good_wifi: false, is_quiet: false, rating: '', cover_image: '' });
      setShowForm(false);
      fetchCafes(searchTerm, filterWifi, filterQuiet, 1, true);
    } catch (err) {
      alert('Error submitting: ' + err.message);
    }
  };

  const openForm = () => setShowForm(true);
  const closeForm = () => setShowForm(false);
  const toggleWifi = () => setFilterWifi((v) => !v);
  const toggleQuiet = () => setFilterQuiet((v) => !v);

  const initials = me?.username
    ? me.username.slice(0, 2).toUpperCase()
    : me?.email
      ? me.email.slice(0, 2).toUpperCase()
      : 'CD';

  return {
    cafes, initialLoading, searching, loadingMore, error, total,
    searchTerm, setSearchTerm,
    filterWifi, toggleWifi,
    filterQuiet, toggleQuiet,
    activeTab, setActiveTab, categories: CATEGORIES,
    showForm, openForm, closeForm,
    formData, handleFormChange, handleFormSubmit,
    handleLoadMore,
    me, isLoggedIn, logout, initials,
  };
}
