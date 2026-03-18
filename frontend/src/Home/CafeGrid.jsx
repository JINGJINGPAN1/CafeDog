import CafeCard from './CafeCard';
import styles from './Home.module.css';

export default function CafeGrid({ cafes, total, loadingMore, onLoadMore }) {
  const leftCol = [];
  const rightCol = [];
  cafes.forEach((cafe, i) => {
    if (i % 2 === 0) leftCol.push(cafe);
    else rightCol.push(cafe);
  });

  return (
    <>
      <div className={styles.hGrid}>
        <div className={styles.hCol}>
          {leftCol.map((cafe) => (
            <CafeCard key={cafe._id} cafe={cafe} />
          ))}
        </div>
        <div className={styles.hCol}>
          {rightCol.map((cafe) => (
            <CafeCard key={cafe._id} cafe={cafe} />
          ))}
        </div>
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
