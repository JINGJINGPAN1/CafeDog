import styles from './Profile.module.css';

export default function ProfileTabs({ tab, onTabChange }) {
  return (
    <div className={styles.pfTabs}>
      <button type="button" className={`${styles.pfTab} ${tab === 'posts' ? styles.pfTabOn : ''}`} onClick={() => onTabChange('posts')}>Posts</button>
      <button type="button" className={`${styles.pfTab} ${tab === 'liked' ? styles.pfTabOn : ''}`} onClick={() => onTabChange('liked')}>Post liked</button>
      <button type="button" className={`${styles.pfTab} ${tab === 'saved' ? styles.pfTabOn : ''}`} onClick={() => onTabChange('saved')}>Cafe saved</button>
    </div>
  );
}
