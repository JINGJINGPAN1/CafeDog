import styles from './Home.module.css';

export default function HomeTabs({ categories, activeTab, onTabChange }) {
  return (
    <nav className={styles.hTabs}>
      {categories.map((cat) => (
        <button
          type="button"
          key={cat}
          className={`${styles.hTab} ${activeTab === cat ? styles.hTabActive : ''}`}
          onClick={() => onTabChange(cat)}
        >
          {cat}
        </button>
      ))}
    </nav>
  );
}
