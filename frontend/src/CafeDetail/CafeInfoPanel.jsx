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

      <div className={styles.cdMap}>&#128205; map coming soon</div>
    </div>
  );
}
