import PropTypes from 'prop-types';
import styles from './Home.module.css';

export default function HomeFilters({
  searchTerm,
  onSearchChange,
  filterWifi,
  onToggleWifi,
  filterQuiet,
  onToggleQuiet,
}) {
  return (
    <div className={styles.hFilters}>
      <div className={styles.hFilterSearch}>
        <svg
          className={styles.hSearchIcon}
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="#aaa"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className={styles.hFilterInput}
          placeholder="Search by name or city..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <button
        type="button"
        className={`${styles.hPill} ${filterWifi ? styles.hPillActive : ''}`}
        onClick={onToggleWifi}
      >
        wifi
      </button>
      <button
        type="button"
        className={`${styles.hPill} ${filterQuiet ? styles.hPillActive : ''}`}
        onClick={onToggleQuiet}
      >
        quiet
      </button>
    </div>
  );
}

HomeFilters.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  filterWifi: PropTypes.bool.isRequired,
  onToggleWifi: PropTypes.func.isRequired,
  filterQuiet: PropTypes.bool.isRequired,
  onToggleQuiet: PropTypes.func.isRequired,
};
