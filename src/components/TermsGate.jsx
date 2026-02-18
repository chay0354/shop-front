import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './TermsGate.css';

const TERMS_ACCEPTED_KEY = 'terms_accepted';

export default function TermsGate({ children }) {
  const [accepted, setAccepted] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setAccepted(localStorage.getItem(TERMS_ACCEPTED_KEY) === '1');
  }, []);

  const handleAccept = () => {
    localStorage.setItem(TERMS_ACCEPTED_KEY, '1');
    setAccepted(true);
  };

  const isAdmin = pathname.startsWith('/admin');
  const isTermsPage = pathname === '/terms';
  if (isAdmin || isTermsPage || accepted) {
    return children;
  }

  return (
    <>
      <div className="terms-gate-overlay" aria-modal="true" role="dialog" aria-labelledby="terms-gate-title">
        <div className="terms-gate-card">
          <h1 id="terms-gate-title" className="terms-gate-title">כניסה לאתר</h1>
          <p className="terms-gate-text">
            האתר מיועד לגילאי 18 ומעלה. בשימוש באתר אתם מאשרים שקראתם והסכמתם ל
            <Link to="/terms" className="terms-gate-link">תקנון</Link>
            {' '}האתר.
          </p>
          <button type="button" className="terms-gate-btn" onClick={handleAccept}>
            אני מאשר/ת
          </button>
        </div>
      </div>
      {children}
    </>
  );
}
