import styles from './CafeDetail.module.css';

export default function CafeInfoPanel({ name, address, hasGoodWifi, isQuiet, rating, postsTotal }) {
  return (
    <div className={styles.cdLeftPad}>
      <div className={styles.cdName}>{name}</div>

      <div className={styles.cdAddr}>
        <span className={styles.cdPin} />
        <span>{address}</span>
      </div>

      <div className={styles.cdBadges}>
        {hasGoodWifi ? <span className={`${styles.cdBadge} ${styles.cdBadgeWifi}`}>wifi</span> : null}
        {isQuiet ? <span className={`${styles.cdBadge} ${styles.cdBadgeQuiet}`}>quiet</span> : null}
        {rating ? <span className={`${styles.cdBadge} ${styles.cdBadgeRating}`}>&#9733; {rating}</span> : null}
      </div>

      <div className={styles.cdHr} />

      <div className={styles.cdStats}>
        <div className={styles.cdStat}>
          <span className={styles.cdStatN}>{postsTotal}</span>
          <span className={styles.cdStatL}>posts</span>
        </div>
        <div className={styles.cdStat}>
          <span className={styles.cdStatN}>{rating || '-'}</span>
          <span className={styles.cdStatL}>avg rating</span>
        </div>
        <div className={styles.cdStat}>
          <span className={styles.cdStatN}>0</span>
          <span className={styles.cdStatL}>saves</span>
        </div>
      </div>

      <div className={styles.cdHr} />

      <div style={{ width: '100%', height: '300px', borderRadius: '12px', overflow: 'hidden', marginTop: '4px' }}>
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
