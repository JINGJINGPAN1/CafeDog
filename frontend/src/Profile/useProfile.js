import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuth } from '../auth/useAuth';

export default function useProfile() {
  const { id } = useParams();
  const { me } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('posts');

  const isSelf = me && String(me._id) === String(id);

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/api/users/${id}`);
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  return { profile, loading, error, tab, setTab, isSelf, refreshProfile };
}
