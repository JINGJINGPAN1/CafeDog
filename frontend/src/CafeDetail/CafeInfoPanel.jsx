import styles from './CafeDetail.module.css';

function HeartIcon({ active }) {
  const stroke = active ? '#eb5757' : '#ccc';
  const fill = active ? '#eb5757' : 'none';
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill={fill} stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function BookmarkIcon({ active }) {
  const stroke = active ? '#f2c94c' : '#888';
  const fill = active ? '#f2c94c' : 'none';
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill={fill} stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function RatingStars({ value }) {
  const rounded = Math.round(value * 2) / 2; // round to nearest 0.5
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= rounded) {
      stars.push(<span key={i} style={{ color: '#f59e0b', fontSize: 18 }}>&#9733;</span>);
    } else if (i - 0.5 <= rounded) {
      // half star: use a layered approach
      stars.push(
        <span key={i} style={{ position: 'relative', display: 'inline-block', width: 18, fontSize: 18 }}>
          <span style={{ color: '#e5e5e5' }}>&#9733;</span>
          <span style={{ position: 'absolute', left: 0, top: 0, overflow: 'hidden', width: '50%', color: '#f59e0b' }}>&#9733;</span>
        </span>
      );
    } else {
      stars.push(<span key={i} style={{ color: '#e5e5e5', fontSize: 18 }}>&#9733;</span>);
    }
  }
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>{stars}</span>;
}

export default function CafeInfoPanel({ name, address, hasGoodWifi, isQuiet, avgRating, postsTotal, savesCount, likesCount, liked, saved, onToggleLike, onToggleSave }) {
  return (
    <div className={styles.cdLeftPad}>
      <div className={styles.cdNameRow}>
        <div className={styles.cdName}>{name}</div>
        <div className={styles.cdNameActions}>
          <button
            type="button"
            className={`${styles.cdActBtn} ${liked ? styles.cdActBtnLiked : ''}`}
            onClick={onToggleLike}
            aria-pressed={liked}
          >
            <HeartIcon active={liked} />
            <span>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
          </button>
          <button
            type="button"
            className={`${styles.cdActBtn} ${saved ? styles.cdActBtnSaved : ''}`}
            onClick={onToggleSave}
            aria-pressed={saved}
          >
            <BookmarkIcon active={saved} />
            <span>{saved ? 'saved' : 'save'}</span>
          </button>
        </div>
      </div>

      <div className={styles.cdAddr}>
        <span className={styles.cdPin} />
        <span>{address}</span>
      </div>

      <div className={styles.cdBadges}>
        {hasGoodWifi ? (
          <span className={`${styles.cdBadge} ${styles.cdBadgeWifi}`}>wifi</span>
        ) : null}
        {isQuiet ? <span className={`${styles.cdBadge} ${styles.cdBadgeQuiet}`}>quiet</span> : null}
      </div>

      <div className={styles.cdHr} />

      <div className={styles.cdStats}>
        <div className={styles.cdStat}>
          <span className={styles.cdStatN}>{postsTotal}</span>
          <span className={styles.cdStatL}>posts</span>
        </div>
        <div className={styles.cdStat}>
          <span className={styles.cdStatNRating}>
            {avgRating != null ? <RatingStars value={avgRating} /> : '-'}
          </span>
          <span className={styles.cdStatL}>{avgRating != null ? avgRating.toFixed(1) : 'no ratings'}</span>
        </div>
        <div className={styles.cdStat}>
          <span className={styles.cdStatN}>{likesCount}</span>
          <span className={styles.cdStatL}>likes</span>
        </div>
        <div className={styles.cdStat}>
          <span className={styles.cdStatN}>{savesCount}</span>
          <span className={styles.cdStatL}>saves</span>
        </div>
      </div>

      <div className={styles.cdHr} />

      <div
        style={{
          width: '100%',
          height: '300px',
          borderRadius: '12px',
          overflow: 'hidden',
          marginTop: '4px',
        }}
      >
        <iframe
          title="Cafe location"
          src={`https://maps.google.com/maps?q=${encodeURIComponent(address || name)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
