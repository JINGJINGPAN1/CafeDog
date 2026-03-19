import { Link } from 'react-router-dom';
import styles from './Profile.module.css';

function renderStars(n) {
  const count = Number(n) || 0;
  let s = '';
  for (let i = 0; i < 5; i++) s += i < count ? '\u2605' : '\u2606';
  return s;
}

export default function ProfilePostCard({ post, index }) {
  const isOdd = index % 2 === 1;
  return (
    <Link to={`/cafe/${post.cafeId}`} className={styles.pfCard}>
      <div className={styles.pfCardImgWrap}>
        {post.photoUrl ? (
          <img className={styles.pfCardImg} src={post.photoUrl} alt="Post" />
        ) : (
          <div className={`${styles.pfCardImgPh} ${isOdd ? styles.pfCardImgPhAlt : ''}`}>
            &#9749;
          </div>
        )}
      </div>
      <div className={styles.pfCardBody}>
        {post.cafeName ? <span className={styles.pfCardCafe}>{post.cafeName}</span> : null}
        <p className={styles.pfCardText}>{post.text}</p>
        <div className={styles.pfCardFoot}>
          <span className={styles.pfCardStars}>{renderStars(post.rating)}</span>
          <span className={styles.pfCardDate}>
            {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}
          </span>
        </div>
      </div>
    </Link>
  );
}
