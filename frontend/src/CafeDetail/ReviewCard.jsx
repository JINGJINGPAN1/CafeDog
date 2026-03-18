import { Link } from 'react-router-dom';
import styles from './CafeDetail.module.css';

const AVATAR_THEMES = [
  { bg: '#F5C4B3', color: '#712B13' },
  { bg: '#E1F5EE', color: '#085041' },
  { bg: '#EEEDFE', color: '#3C3489' },
];

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getInitials(name) {
  if (!name) return '?';
  return name.slice(0, 2).toUpperCase();
}

function renderStars(n) {
  const count = Number(n) || 0;
  let s = '';
  for (let i = 0; i < 5; i++) s += i < count ? '\u2605' : '\u2606';
  return s;
}

const heartSvg = (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#ccc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export default function ReviewCard({ post, index }) {
  const theme = AVATAR_THEMES[index % 3];

  return (
    <div className={styles.cdRv}>
      <div className={styles.cdRvHead}>
        <div className={styles.cdRvLeft}>
          <span className={styles.cdAv} style={{ background: theme.bg, color: theme.color }}>
            {getInitials(post.author)}
          </span>
          <div>
            <div className={styles.cdRvAuthor}>
              {post.authorId ? (
                <Link to={`/profile/${post.authorId}`} className={styles.cdRvAuthorLink}>{post.author}</Link>
              ) : post.author}
            </div>
            <div className={styles.cdRvTime}>{timeAgo(post.createdAt || post.createAt)}</div>
          </div>
        </div>
        <span className={styles.cdRvStars}>{renderStars(post.rating)}</span>
      </div>
      <p className={styles.cdRvText}>{post.text}</p>
      {post.photoUrl ? (
        <img className={styles.cdRvPhoto} src={post.photoUrl} alt="review" />
      ) : null}
      <div className={styles.cdRvFoot}>
        <span className={styles.cdRvAct}>{heartSvg} 0</span>
        <span className={styles.cdRvReply}>reply</span>
      </div>
    </div>
  );
}
