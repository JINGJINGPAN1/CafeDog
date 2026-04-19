import { forwardRef, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
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
    alreadyReviewed,
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
      {!isLoggedIn ? (
        <div className={styles.cdFformLoginPrompt}>
          <span className={styles.cdFformLoginPromptText}>
            <Link to="/login" className={styles.cdFformLoginLink}>
              Log in
            </Link>{' '}
            to share your experience.
          </span>
        </div>
      ) : alreadyReviewed ? (
        <div className={styles.cdFformLoginPrompt}>
          <span className={styles.cdFformLoginPromptText}>
            You&rsquo;ve already reviewed this cafe. Use <strong>edit</strong> on your review above to update it.
          </span>
        </div>
      ) : (
        <div id="cd-review-form-panel" className={styles.cdFformPanel}>
          <form onSubmit={onSubmit} className={styles.cdFformInner}>
            <div className={styles.cdFformPosting}>
              Posting as <strong>{displayName}</strong>
            </div>
            <textarea
              className={`${styles.cdInp} ${styles.cdTa}`}
              ref={reviewTextRef}
              name="text"
              placeholder="What did you love about this place?"
              value={formData.text}
              onChange={onChange}
              required
              rows="3"
            />
            <input
              className={styles.cdInp}
              type="text"
              name="photoUrl"
              placeholder="Photo URL (optional)"
              value={formData.photoUrl}
              onChange={onChange}
            />
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
                <button
                  type="button"
                  className={styles.cdPhotoRemove}
                  onClick={() => onPhotoFileChange?.(null)}
                >
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
            <button type="submit" className={styles.cdPostBtn}>
              Post Check-in
            </button>
          </form>
        </div>
      )}
    </div>
  );
});

export default ReviewForm;
