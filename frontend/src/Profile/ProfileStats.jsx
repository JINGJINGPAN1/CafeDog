import styles from './Profile.module.css';

export default function ProfileStats({ postsCount, likedPostsCount, savedCount }) {
  return (
    <div className={styles.pfStats}>
      <div className={styles.pfStat}>
        <span className={styles.pfStatN}>{postsCount}</span>
        <span className={styles.pfStatL}>posts</span>
      </div>
      <div className={`${styles.pfStat} ${styles.pfStatMid}`}>
        <span className={styles.pfStatN}>{likedPostsCount}</span>
        <span className={styles.pfStatL}>post liked</span>
      </div>
      <div className={styles.pfStat}>
        <span className={styles.pfStatN}>{savedCount}</span>
        <span className={styles.pfStatL}>cafe saved</span>
      </div>
    </div>
  );
}
