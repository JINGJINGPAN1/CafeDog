import { Link } from 'react-router-dom';
import useRegister from './useRegister';
import logoImg from '../assets/image.png';
import styles from '../auth/Auth.module.css';

export default function Register() {
  const { email, setEmail, username, setUsername, password, setPassword, submitting, error, onSubmit } = useRegister();

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.authLogo}>
          <img src={logoImg} alt="" style={{ height: '38px', width: '38px', objectFit: 'contain' }} />
          <span>Café<span className={styles.authLogoAccent}>Dog</span></span>
        </div>
        <h1 className={styles.authTitle}>Create account</h1>
        <form className={styles.authForm} onSubmit={onSubmit}>
          <div className={styles.authField}>
            <label className={styles.authLabel}>Username</label>
            <input className={styles.authInput} value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className={styles.authField}>
            <label className={styles.authLabel}>Email</label>
            <input className={styles.authInput} value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div className={styles.authField}>
            <label className={styles.authLabel}>Password (min 8 chars)</label>
            <input className={styles.authInput} value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </div>
          {error ? <p className={styles.authError}>{error}</p> : null}
          <button className={styles.authSubmit} type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create account'}
          </button>
        </form>
        <p className={styles.authBottom}>
          Already have an account? <Link to="/login" className={styles.authLink}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
