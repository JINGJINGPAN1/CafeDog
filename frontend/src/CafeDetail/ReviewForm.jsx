import { forwardRef, useEffect, useMemo, useRef } from 'react';
import styles from './CafeDetail.module.css';

const ReviewForm = forwardRef(function ReviewForm(
  {
    formData,
    onChange,
    onSubmit,
    onSetRating,
    isLoggedIn,
    displayName,
    reviewTextRef,
    onPhotoFileChange,
    photoFile,
    isOpen = false,
    onToggleOpen,
  },
  ref,
) {
  const fileInputRef = useRef(null);
  const objectUrl = useMemo(() => {
    if (!photoFile) return '';
    return URL.createObjectURL(photoFile);
  }, [photoFile]);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const previewUrl = useMemo(() => {
    if (objectUrl) return objectUrl;
    const url = String(formData?.photoUrl || '').trim();
    return url || '';
  }, [objectUrl, formData]);

  return (
    <div className={styles.cdFform} ref={ref}>
      <button
        type="button"
        className={styles.cdFformToggle}
        onClick={() => onToggleOpen?.()}
        aria-expanded={isOpen}
        aria-controls="cd-review-form-panel"
      >
        <span className={styles.cdFformToggleTitle}>Share your experience</span>
        <span className={`${styles.cdFformChevron} ${isOpen ? styles.cdFformChevronOpen : ''}`} aria-hidden="true">
          ▾
        </span>
      </button>

      <div id="cd-review-form-panel" className={styles.cdFformPanel} hidden={!isOpen}>
        {isOpen ? (
          <form onSubmit={onSubmit} className={styles.cdFformInner}>
            {isLoggedIn ? (
              <div className={styles.cdFformPosting}>
                Posting as <strong>{displayName}</strong>
              </div>
            ) : (
              <input className={styles.cdInp} type="text" name="author" placeholder="Your name" value={formData.author} onChange={onChange} required />
            )}
            <textarea className={`${styles.cdInp} ${styles.cdTa}`} ref={reviewTextRef} name="text" placeholder="What did you love about this place?" value={formData.text} onChange={onChange} required rows="3" />
            <input className={styles.cdInp} type="text" name="photoUrl" placeholder="Photo URL (optional)" value={formData.photoUrl} onChange={onChange} />
            <div className={styles.cdPhotoRow}>
              <input
                ref={fileInputRef}
                className={styles.cdFileInputHidden}
                type="file"
                accept="image/*"
                onChange={(e) => onPhotoFileChange?.(e.target.files?.[0] || null)}
              />
              <button
                type="button"
                className={styles.cdPhotoBtn}
                onClick={() => fileInputRef.current?.click()}
              >
                {photoFile || previewUrl ? 'Change photo' : 'Add photo'}
              </button>
              {photoFile ? (
                <button type="button" className={styles.cdPhotoRemove} onClick={() => onPhotoFileChange?.(null)}>
                  Remove
                </button>
              ) : null}
            </div>
            {previewUrl ? (
              <div className={styles.cdPhotoPreviewWrap}>
                <img className={styles.cdPhotoPreviewImg} src={previewUrl} alt="photo preview" />
              </div>
            ) : null}
            <div className={styles.cdStarRow}>
              <span className={styles.cdStarLabel}>Rating</span>
              <div className={styles.cdStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`${styles.cdStar} ${Number(formData.rating) >= star ? styles.cdStarOn : styles.cdStarOff}`}
                    onClick={() => onSetRating(star)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" className={styles.cdPostBtn}>Post Check-in</button>
          </form>
        ) : null}
      </div>
    </div>
  );
});

export default ReviewForm;
