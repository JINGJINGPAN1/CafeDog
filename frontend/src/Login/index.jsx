import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import useLogin from './useLogin';
import logoImg from '../assets/image.png';
import styles from '../auth/Auth.module.css';

export default function Login() {
  const { email, setEmail, password, setPassword, submitting, error, onSubmit } = useLogin();

  return (
    <div className={styles.authPage}>
      <a className="skipLink" href="#main-content">
        Skip to main content
      </a>
      <main id="main-content" className={styles.authCard}>
        <div className={styles.authLogo}>
          <img
            src={logoImg}
            alt=""
            style={{ height: '38px', width: '38px', objectFit: 'contain' }}
          />
          <span>
            Café<span className={styles.authLogoAccent}>Dog</span>
          </span>
        </div>
        <h1 className={styles.authTitle}>Log in</h1>
        <form className={styles.authForm} onSubmit={onSubmit}>
          <div className={styles.authField}>
            <label className={styles.authLabel}>Email</label>
            <input
              className={styles.authInput}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>
          <div className={styles.authField}>
            <label className={styles.authLabel}>Password</label>
            <input
              className={styles.authInput}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </div>
          {error ? <p className={styles.authError}>{error}</p> : null}
          <button className={styles.authSubmit} type="submit" disabled={submitting}>
            {submitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>
        <p className={styles.authBottom}>
          New here?{' '}
          <Link to="/register" className={styles.authLink}>
            Create an account
          </Link>
        </p>
      </main>
    </div>
  );
}

Login.propTypes = {};
