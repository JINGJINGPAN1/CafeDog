import { forwardRef } from 'react';
import styles from './CafeDetail.module.css';

const ReviewForm = forwardRef(function ReviewForm(
  { formData, onChange, onSubmit, onSetRating, isLoggedIn, displayName, reviewTextRef },
  ref,
) {
  return (
    <div className={styles.cdFform} ref={ref}>
      <h4 className={styles.cdFformTitle}>Share your experience</h4>
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
    </div>
  );
});

export default ReviewForm;
