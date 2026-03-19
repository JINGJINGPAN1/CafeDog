import { useEffect, useMemo, useRef } from 'react';
import styles from './Home.module.css';

export default function AddCafeModal({
  showForm,
  onClose,
  formData,
  onChange,
  onSubmit,
  onCoverFileChange,
  coverFile,
}) {
  const fileInputRef = useRef(null);

  const objectUrl = useMemo(() => {
    if (!coverFile) return '';
    return URL.createObjectURL(coverFile);
  }, [coverFile]);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const previewUrl = useMemo(() => {
    if (objectUrl) return objectUrl;
    const url = String(formData?.cover_image || '').trim();
    return url || '';
  }, [objectUrl, formData]);

  if (!showForm) return null;

  return (
    <div className={styles.hModalBackdrop} onClick={onClose}>
      <div className={styles.hModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.hModalHeader}>
          <h3 className={styles.hModalTitle}>Recommend a Cafe</h3>
          <button type="button" className={styles.hModalClose} onClick={onClose}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <form onSubmit={onSubmit} className={styles.hForm}>
          <input type="text" name="name" className={styles.hInput} placeholder="Cafe name *" value={formData.name} onChange={onChange} required />
          <input type="text" name="address" className={styles.hInput} placeholder="Address *" value={formData.address} onChange={onChange} required />
          <input type="number" name="rating" className={styles.hInput} placeholder="Rating (1-5)" value={formData.rating} onChange={onChange} step="0.1" min="1" max="5" />
          <input type="text" name="cover_image" className={styles.hInput} placeholder="Cover image URL" value={formData.cover_image} onChange={onChange} />
          <div className={styles.hPhotoRow}>
            <input
              ref={fileInputRef}
              type="file"
              className={styles.hFileInputHidden}
              accept="image/*"
              onChange={(e) => onCoverFileChange?.(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              className={styles.hPhotoBtn}
              onClick={() => fileInputRef.current?.click()}
            >
              {coverFile || previewUrl ? 'Change photo' : 'Add photo'}
            </button>
            {coverFile ? (
              <button
                type="button"
                className={styles.hPhotoRemove}
                onClick={() => onCoverFileChange?.(null)}
              >
                Remove
              </button>
            ) : null}
          </div>
          {previewUrl ? (
            <div className={styles.hPhotoPreviewWrap}>
              <img className={styles.hPhotoPreviewImg} src={previewUrl} alt="cover preview" />
            </div>
          ) : null}
          <div className={styles.hFormChecks}>
            <label className={styles.hCheckLabel}>
              <input type="checkbox" name="has_good_wifi" checked={formData.has_good_wifi} onChange={onChange} />
              Fast WiFi
            </label>
            <label className={styles.hCheckLabel}>
              <input type="checkbox" name="is_quiet" checked={formData.is_quiet} onChange={onChange} />
              Quiet for studying
            </label>
          </div>
          <button type="submit" className={styles.hSubmitBtn}>Publish</button>
        </form>
      </div>
    </div>
  );
}
