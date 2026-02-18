import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import './AdminGuard.css';

const ADMIN_AUTH_KEY = 'admin_authenticated';
const ADMIN_PASSWORD = 'SP216';

export default function AdminGuard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setAuthenticated(sessionStorage.getItem(ADMIN_AUTH_KEY) === '1');
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(ADMIN_AUTH_KEY, '1');
      setAuthenticated(true);
      setPassword('');
    } else {
      setError('סיסמה שגויה');
    }
  };

  if (authenticated) {
    return <Outlet />;
  }

  return (
    <div className="admin-guard">
      <div className="admin-guard-card">
        <h1 className="admin-guard-title">כניסה לאזור הניהול</h1>
        <form onSubmit={handleSubmit} className="admin-guard-form">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="סיסמה"
            className="admin-guard-input"
            autoFocus
            aria-label="סיסמה"
          />
          <button type="submit" className="admin-guard-btn">כניסה</button>
          {error && <p className="admin-guard-error" role="alert">{error}</p>}
        </form>
      </div>
    </div>
  );
}
