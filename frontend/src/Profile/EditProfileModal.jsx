import { useEffect, useMemo, useState } from 'react';
import styles from './Profile.module.css';
import { useAuth } from '../auth/useAuth';

export default function EditProfileModal({ open, onClose, currentUsername, onSaved }) {
  const { updateMe, refreshMe } = useAuth();

  const [username, setUsername] = useState(currentUsername || '');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setUsername(currentUsername || '');
    setPassword('');
    setError('');
  }, [open, currentUsername]);

  const canSave = useMemo(() => {
    const u0 = String(currentUsername || '').trim();
    const u1 = String(username || '').trim();
    const p1 = String(password || '').trim();
    return (u1 && u1 !== u0) || p1.length > 0;
  }, [currentUsername, username, password]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSave || submitting) return;

    setSubmitting(true);
    setError('');
    try {
      const payload = {};
      const u1 = String(username || '').trim();
      const u0 = String(currentUsername || '').trim();
      if (u1 && u1 !== u0) payload.username = u1;
      const p1 = String(password || '').trim();
      if (p1) payload.password = p1;

      await updateMe(payload);
      await refreshMe();
      onSaved?.();
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className={styles.pfModalBackdrop} onClick={onClose}>
      <div
        className={styles.pfModal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.pfModalHeader}>
          <h3 className={styles.pfModalTitle}>Edit profile</h3>
          <button
            type="button"
            className={styles.pfModalClose}
            onClick={onClose}
            aria-label="Close"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="#666"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className={styles.pfForm}>
          <label className={styles.pfLabel}>
            Nickname
            <input
              type="text"
              className={styles.pfInput}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your nickname"
              autoComplete="nickname"
            />
          </label>

          <label className={styles.pfLabel}>
            New password
            <input
              type="password"
              className={styles.pfInput}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </label>

          {error ? <p className={styles.pfFormError}>{error}</p> : null}

          <div className={styles.pfFormActions}>
            <button
              type="button"
              className={styles.pfBtnGhost}
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className={styles.pfBtnPrimary} disabled={!canSave || submitting}>
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
