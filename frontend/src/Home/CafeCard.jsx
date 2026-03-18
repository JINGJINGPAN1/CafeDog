import { Link } from 'react-router-dom';
import styles from './Home.module.css';

export default function CafeCard({ cafe }) {
  return (
    <Link to={`/cafe/${cafe._id}`} className={styles.hCardLink}>
      <div className={styles.hCard}>
        {cafe.cover_image ? (
          <img className={styles.hCardImg} src={cafe.cover_image} alt={cafe.name} />
        ) : (
          <div className={styles.hCardPlaceholder} />
        )}
        <div className={styles.hCardBody}>
          <div className={styles.hCardName}>{cafe.name}</div>
          <div className={styles.hCardAddr}>{cafe.address}</div>
          <div className={styles.hCardTags}>
            {cafe.has_good_wifi ? <span className={`${styles.hTag} ${styles.hTagWifi}`}>wifi</span> : null}
            {cafe.is_quiet ? <span className={`${styles.hTag} ${styles.hTagQuiet}`}>quiet</span> : null}
          </div>
          <div className={styles.hCardFooter}>
            <span className={styles.hCardRating}>
              {cafe.rating ? `★ ${cafe.rating}` : ''}
            </span>
            <span className={styles.hCardLikes}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              0
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
