import styles from './CafeDetail.module.css';

export default function CafeInfoPanel({ name, address, location, hasGoodWifi, isQuiet, rating, postsTotal }) {
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

      {(() => {
        const apiKey = import.meta.env.VITE_MAPS_API_KEY;
        if (!apiKey) return <div className={styles.cdMap}>Map unavailable</div>;
        // GeoJSON: coordinates = [lng, lat]
        const q = location && location.coordinates
          ? `${location.coordinates[1]},${location.coordinates[0]}`
          : encodeURIComponent(address || name);
        const src = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${q}&zoom=15`;
        return (
          <iframe
            className={styles.cdMap}
            title="Cafe location"
            src={src}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            style={{ border: 0, width: '100%' }}
          />
        );
      })()}
    </div>
  );
}
