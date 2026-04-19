import PropTypes from 'prop-types';
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

HomeTabs.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.string).isRequired,
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  locating: PropTypes.bool,
};
