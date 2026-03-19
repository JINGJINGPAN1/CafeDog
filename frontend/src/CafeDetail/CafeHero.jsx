import { coverImageSrc } from '../lib/coverImage';
import styles from './CafeDetail.module.css';

export default function CafeHero({ coverImage, name }) {
  const src = coverImageSrc(coverImage);
  return (
    <div className={styles.cdHero}>
      {src ? (
        <img className={styles.cdHeroImg} src={src} alt={name} />
      ) : (
        <div className={styles.cdHeroPh}>
          <span className={styles.cdHeroEmoji}>&#9749;</span>
        </div>
      )}
      <div className={styles.cdDots}>
        <span className={`${styles.cdDot} ${styles.cdDotOn}`} />
        <span className={styles.cdDot} />
        <span className={styles.cdDot} />
      </div>
    </div>
  );
}
