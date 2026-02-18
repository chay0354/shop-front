import { Link } from 'react-router-dom';
import './SiteFooter.css';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-trust">
        <span>משלוחים מהירים</span>
        <span className="site-footer-dot" />
        <span>תשלום מאובטח</span>
        <span className="site-footer-dot" />
        <Link to="/terms" className="site-footer-link">תקנון</Link>
        <span className="site-footer-dot" />
        <span>שירות לקוחות</span>
      </div>
      <p className="site-footer-copyright">
        כל הזכויות שמורות ל־&quot;פריקס ישראל&quot;. ח.פ 65975948. אין להעתיק, לשכפל או לצלם.
      </p>
      <div className="site-footer-payments" aria-label="אמצעי תשלום שמכבדים">
        <span>ביט</span>
        <span className="site-footer-dot" />
        <span>כרטיס אשראי</span>
        <span className="site-footer-dot" />
        <span>אמריקן אקספרס</span>
        <span className="site-footer-dot" />
        <span>מזומן</span>
        <span className="site-footer-dot" />
        <span>אפל פיי</span>
      </div>
    </footer>
  );
}
