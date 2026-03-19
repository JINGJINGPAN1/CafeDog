import { Link } from 'react-router-dom';
import { coverImageSrc } from '../lib/coverImage';
import styles from './Profile.module.css';

function renderStars(n) {
  const count = Number(n) || 0;
  let s = '';
  for (let i = 0; i < 5; i++) s += i < count ? '\u2605' : '\u2606';
  return s;
}

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function ProfilePostCard({ post, isLast }) {
  const src = coverImageSrc(post.cafeCoverImage);
  return (
    <Link
      to={`/cafe/${post.cafeId}`}
      className={`${styles.pfPostItem} ${isLast ? '' : styles.pfPostItemBorder}`}
    >
      {src ? (
        <img className={styles.pfPostThumb} src={src} alt={post.cafeName} />
      ) : (
        <div className={styles.pfPostAv}>{getInitials(post.cafeName)}</div>
      )}
      <div className={styles.pfPostBody}>
        <div className={styles.pfPostTopRow}>
          <span className={styles.pfPostCafe}>{post.cafeName || 'Unknown café'}</span>
          <span className={styles.pfPostDate}>
            {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}
          </span>
        </div>
        <span className={styles.pfPostStars}>{renderStars(post.rating)}</span>
        <p className={styles.pfPostText}>{post.text}</p>
      </div>
    </Link>
  );
}
