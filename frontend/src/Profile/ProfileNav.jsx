import { Link } from 'react-router-dom';
import styles from './Profile.module.css';

export default function ProfileNav() {
  return (
    <header className={styles.pfNav}>
      <span className={styles.pfLogo}><span className={styles.pfLogoCafe}>caf&eacute;</span><span className={styles.pfLogoDog}>dog</span></span>
      <Link to="/" className={styles.pfBack}>&larr; back to home</Link>
    </header>
  );
}
