import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import NotificationBell from '../NotificationBell';
import './Navbar.css';

const PAGE_TITLES = {
  '/dashboard':    'Dashboard',
  '/jobs':         'Job Listings',
  '/applications': 'My Applications',
  '/resume':       'Resume & AI Analysis',
  '/settings':     'Settings',
  '/admin':        'Admin Panel',
};

export default function Navbar({ onToggleSidebar }) {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const title = PAGE_TITLES[location.pathname] ?? 'Job Dashboard';

  return (
    <header className="navbar">
      <div className="navbar__left">
        <button className="navbar__toggle" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <span className="material-icons">menu</span>
        </button>
        <h1 className="navbar__title">{title}</h1>
      </div>

      <div className="navbar__right">
        <NotificationBell />
        <button
          className="navbar__icon-btn"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          <span className="material-icons">{isDark ? 'light_mode' : 'dark_mode'}</span>
        </button>
      </div>
    </header>
  );
}
