import PropTypes from 'prop-types';
import styles from './Profile.module.css';

export default function ProfileStats({ postsCount, likedPostsCount, likedCafesCount, savedCount }) {
  return (
    <div className={styles.pfStats}>
      <div className={styles.pfStat}>
        <span className={styles.pfStatN}>{postsCount}</span>
        <span className={styles.pfStatL}>posts</span>
      </div>
      <div className={`${styles.pfStat} ${styles.pfStatMid}`}>
        <span className={styles.pfStatN}>{likedPostsCount}</span>
        <span className={styles.pfStatL}>liked posts</span>
      </div>
      <div className={`${styles.pfStat} ${styles.pfStatMid}`}>
        <span className={styles.pfStatN}>{likedCafesCount}</span>
        <span className={styles.pfStatL}>liked cafes</span>
      </div>
      <div className={styles.pfStat}>
        <span className={styles.pfStatN}>{savedCount}</span>
        <span className={styles.pfStatL}>saved cafes</span>
      </div>
    </div>
  );
}

ProfileStats.propTypes = {
  postsCount: PropTypes.number.isRequired,
  likedPostsCount: PropTypes.number.isRequired,
  likedCafesCount: PropTypes.number.isRequired,
  savedCount: PropTypes.number.isRequired,
};
