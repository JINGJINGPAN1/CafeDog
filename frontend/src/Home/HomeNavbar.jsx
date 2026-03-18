import { Link } from 'react-router-dom';
import styles from './Home.module.css';

export default function HomeNavbar({ isLoggedIn, meId, initials, logout }) {
  return (
    <header className={styles.hNavbar}>
      <Link to="/" className={styles.hLogo}>
        cafe&nbsp;<span className={styles.hLogoAccent}>dog</span>
      </Link>

      <div className={styles.hNavRight}>
        {isLoggedIn ? (
          <>
            <Link to={`/profile/${meId}`} className={styles.hAvatar}>{initials}</Link>
            <button type="button" className={styles.hLogoutBtn} onClick={logout}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className={styles.hAuthLink}>Log in</Link>
            <Link to="/register" className={`${styles.hAuthLink} ${styles.hAuthLinkRegister}`}>Sign up</Link>
          </>
        )}
      </div>
    </header>
  );
}
