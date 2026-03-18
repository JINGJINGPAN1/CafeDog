import { Link } from 'react-router-dom';
import styles from './Profile.module.css';

function renderStars(n) {
  const count = Number(n) || 0;
  let s = '';
  for (let i = 0; i < 5; i++) s += i < count ? '\u2605' : '\u2606';
  return s;
}

export default function ProfileCafeCard({ cafe, index }) {
  const isOdd = index % 2 === 1;
  return (
    <Link to={`/cafe/${cafe._id}`} className={styles.pfCard}>
      <div className={styles.pfCardImgWrap}>
        {cafe.cover_image ? (
          <img className={styles.pfCardImg} src={cafe.cover_image} alt={cafe.name} />
        ) : (
          <div className={`${styles.pfCardImgPh} ${isOdd ? styles.pfCardImgPhAlt : ''}`}>&#9749;</div>
        )}
      </div>
      <div className={styles.pfCardBody}>
        <span className={styles.pfCafeName}>{cafe.name}</span>
        {cafe.address ? <span className={styles.pfCafeAddr}>{cafe.address}</span> : null}
        <div className={styles.pfCafeBadges}>
          {cafe.has_good_wifi ? <span className={`${styles.pfCafePill} ${styles.pfCafePillWifi}`}>wifi</span> : null}
          {cafe.is_quiet ? <span className={`${styles.pfCafePill} ${styles.pfCafePillQuiet}`}>quiet</span> : null}
          {cafe.rating ? <span className={`${styles.pfCafePill} ${styles.pfCafePillRating}`}>{renderStars(cafe.rating)}</span> : null}
        </div>
      </div>
    </Link>
  );
}
