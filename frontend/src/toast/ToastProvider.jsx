import { useEffect, useId, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import styles from './Toast.module.css';
import { ToastContext } from './ToastContext';

let idCounter = 0;

export function ToastProvider({ children }) {
  const confirmTitleId = useId();
  const confirmDescId = useId();
  const confirmModalRef = useRef(null);
  const confirmCancelBtnRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const resolveRef = useRef(null);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 250);
  }, []);

  const addToast = useCallback(
    (message, type) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, message, type, exiting: false }]);
      setTimeout(() => removeToast(id), 3000);
    },
    [removeToast],
  );

  const success = useCallback((msg) => addToast(msg, 'success'), [addToast]);
  const error = useCallback((msg) => addToast(msg, 'error'), [addToast]);

  const confirm = useCallback((message, title) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setConfirmState({ message, title: title || 'Confirm' });
    });
  }, []);

  const handleConfirm = useCallback((result) => {
    if (resolveRef.current) resolveRef.current(result);
    resolveRef.current = null;
    setConfirmState(null);
  }, []);

  useEffect(() => {
    if (!confirmState) return undefined;

    previouslyFocusedRef.current = document.activeElement;
    queueMicrotask(() => confirmCancelBtnRef.current?.focus?.());

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleConfirm(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    const root = confirmModalRef.current;
    const trapFocus = (e) => {
      if (e.key !== 'Tab' || !root) return;

      const focusables = Array.from(
        root.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => {
        if (!(el instanceof HTMLElement)) return false;
        if (el.hasAttribute('disabled')) return false;
        if (el.tabIndex < 0) return false;
        return true;
      });

      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    root?.addEventListener('keydown', trapFocus);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      root?.removeEventListener('keydown', trapFocus);
      const prev = previouslyFocusedRef.current;
      if (prev && typeof prev.focus === 'function') {
        queueMicrotask(() => prev.focus());
      }
    };
  }, [confirmState, handleConfirm]);

  const toast = { success, error, confirm };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast stack */}
      {toasts.length > 0 && (
        <div className={styles.toastContainer}>
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`${styles.toast} ${t.type === 'success' ? styles.toastSuccess : styles.toastError} ${t.exiting ? styles.toastExit : ''}`}
            >
              <span className={styles.toastIcon}>{t.type === 'success' ? '\u2713' : '\u2717'}</span>
              <span className={styles.toastMsg}>{t.message}</span>
              <button type="button" className={styles.toastClose} onClick={() => removeToast(t.id)}>
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Confirm modal */}
      {confirmState && (
        <div className={styles.confirmBackdrop} onClick={() => handleConfirm(false)}>
          <div
            ref={confirmModalRef}
            className={styles.confirmModal}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={confirmTitleId}
            aria-describedby={confirmDescId}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id={confirmTitleId} className={styles.confirmTitle}>
              {confirmState.title}
            </h3>
            <p id={confirmDescId} className={styles.confirmMsg}>
              {confirmState.message}
            </p>
            <div className={styles.confirmActions}>
              <button
                ref={confirmCancelBtnRef}
                type="button"
                className={styles.confirmCancel}
                onClick={() => handleConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmBtn}
                onClick={() => handleConfirm(true)}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

ToastProvider.propTypes = {
  children: PropTypes.node,
};
