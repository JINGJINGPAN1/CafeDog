import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="authPage">
      <div className="authCard">
        <div className="authLogo"><span className="authLogoCafe">cafe</span><span className="authLogoDog">dog</span></div>
        <h1 className="authTitle">Log in</h1>
        <form className="authForm" onSubmit={onSubmit}>
          <div className="authField">
            <label className="authLabel">Email</label>
            <input className="authInput" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div className="authField">
            <label className="authLabel">Password</label>
            <input className="authInput" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </div>
          {error ? <p className="authError">{error}</p> : null}
          <button className="authSubmit" type="submit" disabled={submitting}>
            {submitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>
        <p className="authBottom">
          New here? <Link to="/register" className="authLink">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
