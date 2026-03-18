import styles from './Profile.module.css';

export default function ProfileStats({ postsCount, cafesCount, likesCount }) {
  return (
    <div className={styles.pfStats}>
      <div className={styles.pfStat}>
        <span className={styles.pfStatN}>{postsCount}</span>
        <span className={styles.pfStatL}>posts</span>
      </div>
      <div className={`${styles.pfStat} ${styles.pfStatMid}`}>
        <span className={styles.pfStatN}>{cafesCount}</span>
        <span className={styles.pfStatL}>caf&eacute;s added</span>
      </div>
      <div className={styles.pfStat}>
        <span className={styles.pfStatN}>{likesCount}</span>
        <span className={styles.pfStatL}>likes</span>
      </div>
    </div>
  );
}
