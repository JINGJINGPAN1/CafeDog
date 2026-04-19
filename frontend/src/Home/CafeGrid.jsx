import CafeCard from './CafeCard';
import PropTypes from 'prop-types';
import styles from './Home.module.css';

export default function CafeGrid({ cafes, total, loadingMore, onLoadMore }) {
  return (
    <>
      <div className={styles.hGrid}>
        {cafes.map((cafe) => (
          <CafeCard key={cafe._id} cafe={cafe} />
        ))}
      </div>

      {cafes.length < total ? (
        <div className={styles.hLoadMoreWrap}>
          <button
            type="button"
            className={styles.hLoadMore}
            onClick={onLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      ) : null}
    </>
  );
}

CafeGrid.propTypes = {
  cafes: PropTypes.arrayOf(PropTypes.object).isRequired,
  total: PropTypes.number.isRequired,
  loadingMore: PropTypes.bool.isRequired,
  onLoadMore: PropTypes.func.isRequired,
};
