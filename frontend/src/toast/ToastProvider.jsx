import { useState, useCallback, useRef } from 'react';
import styles from './Toast.module.css';
import { ToastContext } from './ToastContext';

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const resolveRef = useRef(null);

  const removeToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    );
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

  const handleConfirm = (result) => {
    if (resolveRef.current) resolveRef.current(result);
    resolveRef.current = null;
    setConfirmState(null);
  };

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
              <span className={styles.toastIcon}>
                {t.type === 'success' ? '\u2713' : '\u2717'}
              </span>
              <span className={styles.toastMsg}>{t.message}</span>
              <button
                type="button"
                className={styles.toastClose}
                onClick={() => removeToast(t.id)}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>{confirmState.title}</h3>
            <p className={styles.confirmMsg}>{confirmState.message}</p>
            <div className={styles.confirmActions}>
              <button
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
