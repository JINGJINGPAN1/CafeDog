import styles from './Home.module.css';

export default function HomeTabs({ categories, activeTab, onTabChange, locating }) {
  return (
    <nav className={styles.hTabs}>
      {categories.map((cat) => {
        const isLocatingTab = cat === 'nearby' && locating;
        return (
          <button
            type="button"
            key={cat}
            className={`${styles.hTab} ${activeTab === cat ? styles.hTabActive : ''}`}
            onClick={() => onTabChange(cat)}
            disabled={isLocatingTab}
          >
            {isLocatingTab ? 'locating…' : cat}
          </button>
        );
      })}
    </nav>
  );
}
