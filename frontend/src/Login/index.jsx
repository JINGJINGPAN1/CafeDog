import { Link } from 'react-router-dom';
import useLogin from './useLogin';
import styles from '../auth/Auth.module.css';

export default function Login() {
  const { email, setEmail, password, setPassword, submitting, error, onSubmit } = useLogin();

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.authLogo}><span className={styles.authLogoCafe}>cafe</span><span className={styles.authLogoDog}>dog</span></div>
        <h1 className={styles.authTitle}>Log in</h1>
        <form className={styles.authForm} onSubmit={onSubmit}>
          <div className={styles.authField}>
            <label className={styles.authLabel}>Email</label>
            <input className={styles.authInput} value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div className={styles.authField}>
            <label className={styles.authLabel}>Password</label>
            <input className={styles.authInput} value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </div>
          {error ? <p className={styles.authError}>{error}</p> : null}
          <button className={styles.authSubmit} type="submit" disabled={submitting}>
            {submitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>
        <p className={styles.authBottom}>
          New here? <Link to="/register" className={styles.authLink}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
