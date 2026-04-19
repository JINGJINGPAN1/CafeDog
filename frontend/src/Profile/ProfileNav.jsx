import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import logoImg from '../assets/image.png';
import styles from './Profile.module.css';

export default function ProfileNav() {
  return (
    <header className={styles.pfNav}>
      <nav className={styles.pfNavInner} aria-label="Site">
        <Link to="/" className={styles.pfLogo}>
          <img
            src={logoImg}
            alt=""
            style={{ height: '32px', width: '32px', objectFit: 'contain' }}
          />
          <span>
            Café<span className={styles.pfLogoAccent}>Dog</span>
          </span>
        </Link>
        <Link to="/" className={styles.pfBack}>
          &larr; back to home
        </Link>
      </nav>
    </header>
  );
}

ProfileNav.propTypes = {};
