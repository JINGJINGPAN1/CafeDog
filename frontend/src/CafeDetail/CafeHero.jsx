import styles from './CafeDetail.module.css';

export default function CafeHero({ coverImage, name }) {
  return (
    <div className={styles.cdHero}>
      {coverImage ? (
        <img className={styles.cdHeroImg} src={coverImage} alt={name} />
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
