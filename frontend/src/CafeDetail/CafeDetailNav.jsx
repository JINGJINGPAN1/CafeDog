import { Link } from 'react-router-dom';
import styles from './CafeDetail.module.css';

export default function CafeDetailNav({ name, isOwner, onEdit, onDelete }) {
  return (
    <header className={styles.cdNav}>
      <Link to="/" className={styles.cdBack}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </Link>
      <span className={styles.cdNavTitle}>{name}</span>
      <div className={styles.cdNavRight}>
        {isOwner ? (
          <>
            <button type="button" className={styles.cdBtnEdit} onClick={onEdit}>Edit</button>
            <button type="button" className={styles.cdBtnDel} onClick={onDelete}>Delete</button>
          </>
        ) : <span className={styles.cdNavRightSpacer} />}
      </div>
    </header>
  );
}
