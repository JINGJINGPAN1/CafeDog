import { Link } from 'react-router-dom';
import { coverImageSrc } from '../lib/coverImage';
import styles from './Home.module.css';

export default function CafeCard({ cafe }) {
  const src = coverImageSrc(cafe.cover_image);
  return (
    <Link to={`/cafe/${cafe._id}`} className={styles.hCardLink}>
      <div className={styles.hCard}>
        <div className={styles.hCardImgWrap}>
          {src ? (
            <img className={styles.hCardImg} src={src} alt={cafe.name} />
          ) : (
            <div className={styles.hCardPlaceholder}>&#9749;</div>
          )}
          <div className={styles.hCardOverlay}>
            <div className={styles.hCardOverlayTop}>
              {cafe.avgRating != null ? (
                <span className={styles.hRatingBadge}>&#9733; {cafe.avgRating}</span>
              ) : null}
            </div>
            <div className={styles.hCardOverlayBottom}>
              {cafe.has_good_wifi ? <span className={styles.hTagOverlay}>wifi</span> : null}
              {cafe.is_quiet ? <span className={styles.hTagOverlay}>quiet</span> : null}
            </div>
          </div>
        </div>
        <div className={styles.hCardBody}>
          <div className={styles.hCardName}>{cafe.name}</div>
          <div className={styles.hCardAddr}>{cafe.address}</div>
          <div className={styles.hCardFooter}>
            <span className={styles.hCardLikes}>
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {cafe.likesCount ?? 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
