import { Link } from 'react-router-dom';
import { coverImageSrc } from '../lib/coverImage';
import styles from './Profile.module.css';
import tag from '../styles/cafeTags.module.css';

function RatingStars({ value }) {
  const rounded = Math.round(value * 2) / 2;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= rounded) {
      stars.push(<span key={i} style={{ color: '#f59e0b', fontSize: 14 }}>★</span>);
    } else if (i - 0.5 <= rounded) {
      stars.push(
        <span key={i} style={{ position: 'relative', display: 'inline-block', width: 14, fontSize: 14 }}>
          <span style={{ color: '#e5e5e5' }}>★</span>
          <span style={{ position: 'absolute', left: 0, top: 0, overflow: 'hidden', width: '50%', color: '#f59e0b' }}>★</span>
        </span>
      );
    } else {
      stars.push(<span key={i} style={{ color: '#e5e5e5', fontSize: 14 }}>★</span>);
    }
  }
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>{stars}</span>;
}

export default function ProfileCafeCard({ cafe, index }) {
  const isOdd = index % 2 === 1;
  const src = coverImageSrc(cafe.cover_image);
  return (
    <Link to={`/cafe/${cafe._id}`} className={styles.pfCard}>
      <div className={styles.pfCardImgWrap}>
        {src ? (
          <img className={styles.pfCardImg} src={src} alt={cafe.name} />
        ) : (
          <div className={`${styles.pfCardImgPh} ${isOdd ? styles.pfCardImgPhAlt : ''}`}>
            &#9749;
          </div>
        )}
      </div>
      <div className={styles.pfCardBody}>
        <span className={styles.pfCafeName}>{cafe.name}</span>
        {cafe.address ? <span className={styles.pfCafeAddr}>{cafe.address}</span> : null}
        {cafe.avgRating != null ? (
          <div className={styles.pfCafeStars}>
            <RatingStars value={cafe.avgRating} />
          </div>
        ) : null}
        <div className={styles.pfCafeBadges}>
          {cafe.has_good_wifi ? (
            <span className={`${tag.pill} ${tag.wifi}`}>wifi</span>
          ) : null}
          {cafe.is_quiet ? (
            <span className={`${tag.pill} ${tag.quiet}`}>quiet</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
