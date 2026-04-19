import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import styles from './CafeDetail.module.css';

export default function CafeDetailNav({ isOwner, onEdit, onDelete }) {
  return (
    <header className={styles.cdNav} aria-label="Café">
      <Link to="/" className={styles.cdBack}>
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="#333"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </Link>
      <div className={styles.cdNavRight}>
        {isOwner ? (
          <>
            <button type="button" className={styles.cdBtnEdit} onClick={onEdit}>
              Edit
            </button>
            <button type="button" className={styles.cdBtnDel} onClick={onDelete}>
              Delete
            </button>
          </>
        ) : (
          <span className={styles.cdNavRightSpacer} />
        )}
      </div>
    </header>
  );
}

CafeDetailNav.propTypes = {
  isOwner: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
