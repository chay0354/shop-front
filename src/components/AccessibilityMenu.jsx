import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './AccessibilityMenu.css';

const STORAGE_KEY = 'accessibility-settings';

const defaultSettings = {
  fontSize: 'normal', // normal | large | x-large
  contrast: false,
  underlineLinks: false,
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return { ...defaultSettings, ...s };
    }
  } catch (_) {}
  return defaultSettings;
}

function saveSettings(s) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch (_) {}
}

function applySettings(s) {
  const root = document.documentElement;
  root.setAttribute('data-font-size', s.fontSize);
  root.setAttribute('data-contrast', s.contrast ? 'high' : 'normal');
  root.setAttribute('data-links', s.underlineLinks ? 'underline' : 'normal');
}

// Apply saved settings immediately so the page doesn’t flash default
applySettings(loadSettings());

export default function AccessibilityMenu() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(() => loadSettings());
  const { pathname } = useLocation();

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    applySettings(s);
  }, []);

  const update = (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings(next);
    applySettings(next);
  };

  const reset = () => {
    setSettings(defaultSettings);
    saveSettings(defaultSettings);
    applySettings(defaultSettings);
  };

  if (pathname.startsWith('/admin')) return null;

  return (
    <div className="accessibility-menu">
      <button
        type="button"
        className="accessibility-menu-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="תפריט נגישות"
        title="נגישות"
      >
        <span className="accessibility-menu-label">נגישות</span>
      </button>
      {open && (
        <>
          <div className="accessibility-menu-backdrop" onClick={() => setOpen(false)} aria-hidden />
          <div className="accessibility-menu-panel" role="dialog" aria-label="תפריט נגישות">
            <h3 className="accessibility-menu-title">נגישות</h3>
            <div className="accessibility-menu-options">
              <div className="accessibility-menu-group">
                <span className="accessibility-menu-group-label">גודל טקסט</span>
                <div className="accessibility-menu-buttons">
                  <button
                    type="button"
                    className={settings.fontSize === 'normal' ? 'active' : ''}
                    onClick={() => update('fontSize', 'normal')}
                  >
                    רגיל
                  </button>
                  <button
                    type="button"
                    className={settings.fontSize === 'large' ? 'active' : ''}
                    onClick={() => update('fontSize', 'large')}
                  >
                    גדול
                  </button>
                  <button
                    type="button"
                    className={settings.fontSize === 'x-large' ? 'active' : ''}
                    onClick={() => update('fontSize', 'x-large')}
                  >
                    גדול מאוד
                  </button>
                </div>
              </div>
              <div className="accessibility-menu-group">
                <label className="accessibility-menu-check">
                  <input
                    type="checkbox"
                    checked={settings.contrast}
                    onChange={(e) => update('contrast', e.target.checked)}
                  />
                  <span>ניגודיות גבוהה</span>
                </label>
              </div>
              <div className="accessibility-menu-group">
                <label className="accessibility-menu-check">
                  <input
                    type="checkbox"
                    checked={settings.underlineLinks}
                    onChange={(e) => update('underlineLinks', e.target.checked)}
                  />
                  <span>הדגש קישורים</span>
                </label>
              </div>
              <button type="button" className="accessibility-menu-reset" onClick={reset}>
                איפוס להגדרות ברירת מחדל
              </button>
            </div>
            <button
              type="button"
              className="accessibility-menu-close"
              onClick={() => setOpen(false)}
              aria-label="סגור"
            >
              ×
            </button>
          </div>
        </>
      )}
    </div>
  );
}
