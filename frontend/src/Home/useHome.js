import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../auth/useAuth';
import { useToast } from '../toast/useToast';
import { apiFetch } from '../lib/api';

const CAFES_PER_PAGE = 10;
const CATEGORIES = ['discover', 'nearby', 'new places', 'top rated'];

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
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    has_good_wifi: false,
    is_quiet: false,
    rating: '',
    cover_image: '',
    lat: null,
    lng: null,
    placeId: '',
  });
  const [coverFile, setCoverFile] = useState(null);

  const [activeTab, setActiveTabRaw] = useState('discover');
  const debounceRef = useRef(null);
  const hasLoadedOnce = useRef(false);

  const fetchCafes = useCallback((search, wifi, quiet, tab, pg, reset, nearbyCoords) => {
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
    if (nearbyCoords) {
      params.append('nearby', 'true');
      params.append('lat', String(nearbyCoords.lat));
      params.append('lng', String(nearbyCoords.lng));
    }
    params.append('page', String(pg));
    params.append('limit', String(CAFES_PER_PAGE));

    fetch(`/api/cafes?${params.toString()}`, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Request failed: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data.cafes) ? data.cafes : [];
        if (reset) {
          setCafes(list);
        } else {
          setCafes((prev) => [...prev, ...list]);
        }
        setTotal(data.total || 0);
        setPage(pg);
        hasLoadedOnce.current = true;
        setInitialLoading(false);
        setSearching(false);
        setLoadingMore(false);
      })
      .catch((err) => {
        console.error(err);
        if (reset) setCafes([]);
        setTotal(0);
        setInitialLoading(false);
        setSearching(false);
        setLoadingMore(false);
        toast.error(err.message || 'Failed to load cafes');
      });
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      const activeCoords = activeTab === 'nearby' ? coords : null;
      fetchCafes(searchTerm, filterWifi, filterQuiet, activeTab, 1, true, activeCoords);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, filterWifi, filterQuiet, coords, activeTab, fetchCafes]);

  const handleLoadMore = () => {
    const activeCoords = activeTab === 'nearby' ? coords : null;
    fetchCafes(searchTerm, filterWifi, filterQuiet, activeTab, page + 1, false, activeCoords);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };
      if (name === 'address') {
        // User edited the address text — invalidate previously picked place.
        next.lat = null;
        next.lng = null;
        next.placeId = '';
      }
      return next;
    });
  };

  const handlePlaceSelect = (place) => {
    if (!place) {
      setFormData((prev) => ({ ...prev, lat: null, lng: null, placeId: '' }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      placeId: place.placeId,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error('Please log in to recommend a cafe.');
      return;
    }
    if (!formData.name || !formData.address) {
      toast.error('Name and address are required!');
      return;
    }
    if (!formData.placeId || formData.lat == null || formData.lng == null) {
      toast.error('Please pick an address from the dropdown suggestions.');
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
          name: formData.name,
          address: formData.address,
          has_good_wifi: formData.has_good_wifi,
          is_quiet: formData.is_quiet,
          rating: Number(formData.rating),
          cover_image: coverUrl,
          lat: formData.lat,
          lng: formData.lng,
          placeId: formData.placeId,
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
        lat: null,
        lng: null,
        placeId: '',
      });
      setCoverFile(null);
      setShowForm(false);
      const activeCoords = activeTab === 'nearby' ? coords : null;
      fetchCafes(searchTerm, filterWifi, filterQuiet, activeTab, 1, true, activeCoords);
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

  const setActiveTab = (tab) => {
    if (tab !== 'nearby') {
      setActiveTabRaw(tab);
      return;
    }
    if (coords) {
      setActiveTabRaw('nearby');
      return;
    }
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setActiveTabRaw('nearby');
        setLocating(false);
      },
      (err) => {
        console.error('[nearby] geolocation error:', err);
        setLocating(false);
        const msg =
          err.code === 1
            ? 'Location permission denied. Please allow access to use Nearby.'
            : 'Could not get your location.';
        toast.error(msg);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

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
    locating,
    activeTab,
    setActiveTab,
    categories: CATEGORIES,
    showForm,
    openForm,
    closeForm,
    formData,
    handleFormChange,
    handleFormSubmit,
    handlePlaceSelect,
    coverFile,
    setCoverFile,
    handleLoadMore,
    me,
    isLoggedIn,
    logout,
    initials,
  };
}
