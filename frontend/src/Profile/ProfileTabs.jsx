import PropTypes from 'prop-types';
import styles from './Profile.module.css';

export default function ProfileTabs({ tab, onTabChange }) {
  return (
    <div className={styles.pfTabs}>
      <button
        type="button"
        className={`${styles.pfTab} ${tab === 'cafes' ? styles.pfTabOn : ''}`}
        onClick={() => onTabChange('cafes')}
      >
        Added Cafes
      </button>
      <button
        type="button"
        className={`${styles.pfTab} ${tab === 'posts' ? styles.pfTabOn : ''}`}
        onClick={() => onTabChange('posts')}
      >
        My Reviews
      </button>
      <button
        type="button"
        className={`${styles.pfTab} ${tab === 'liked' ? styles.pfTabOn : ''}`}
        onClick={() => onTabChange('liked')}
      >
        Liked Reviews
      </button>
      <button
        type="button"
        className={`${styles.pfTab} ${tab === 'likedCafes' ? styles.pfTabOn : ''}`}
        onClick={() => onTabChange('likedCafes')}
      >
        Liked Cafes
      </button>
      <button
        type="button"
        className={`${styles.pfTab} ${tab === 'saved' ? styles.pfTabOn : ''}`}
        onClick={() => onTabChange('saved')}
      >
        Saved Cafes
      </button>
    </div>
  );
}

ProfileTabs.propTypes = {
  tab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
};
