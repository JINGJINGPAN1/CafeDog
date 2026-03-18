import { Link } from 'react-router-dom';
import styles from './Profile.module.css';

export default function ProfileNav() {
  return (
    <header className={styles.pfNav}>
      <div className={styles.pfNavInner}>
        <Link to="/" className={styles.pfLogo}>cafedog</Link>
        <Link to="/" className={styles.pfBack}>&larr; back to home</Link>
      </div>
    </header>
  );
}
