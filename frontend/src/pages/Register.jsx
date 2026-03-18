import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import './Register.css';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await register({ email, username, password });
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
        <h1 className="authTitle">Create account</h1>
        <form className="authForm" onSubmit={onSubmit}>
          <div className="authField">
            <label className="authLabel">Username</label>
            <input className="authInput" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="authField">
            <label className="authLabel">Email</label>
            <input className="authInput" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div className="authField">
            <label className="authLabel">Password (min 8 chars)</label>
            <input className="authInput" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </div>
          {error ? <p className="authError">{error}</p> : null}
          <button className="authSubmit" type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create account'}
          </button>
        </form>
        <p className="authBottom">
          Already have an account? <Link to="/login" className="authLink">Log in</Link>
        </p>
      </div>
    </div>
  );
}
