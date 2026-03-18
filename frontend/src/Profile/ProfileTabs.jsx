import styles from './Profile.module.css';

export default function ProfileTabs({ tab, onTabChange }) {
  return (
    <div className={styles.pfTabs}>
      <button type="button" className={`${styles.pfTab} ${tab === 'posts' ? styles.pfTabOn : ''}`} onClick={() => onTabChange('posts')}>Posts</button>
      <button type="button" className={`${styles.pfTab} ${tab === 'cafes' ? styles.pfTabOn : ''}`} onClick={() => onTabChange('cafes')}>Caf&eacute;s Added</button>
      <button type="button" className={`${styles.pfTab} ${tab === 'liked' ? styles.pfTabOn : ''}`} onClick={() => onTabChange('liked')}>Liked Posts</button>
    </div>
  );
}
