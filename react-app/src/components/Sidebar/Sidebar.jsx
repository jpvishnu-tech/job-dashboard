import { NavLink } from 'react-router-dom';
import { useAuth }  from '../../context/AuthContext';
import './Sidebar.css';

const NAV_ITEMS = [
  { id: 'dashboard',    to: '/',             end: true, icon: 'dashboard',    label: 'Dashboard'     },
  { id: 'jobs',         to: '/jobs',                    icon: 'work_outline', label: 'Jobs'          },
  { id: 'applications', to: '/applications',            icon: 'assignment',   label: 'Applications', badge: 5 },
  { id: 'resume',       to: '/resume',                  icon: 'article',      label: 'Resume'        },
  { id: 'settings',     to: '/settings',                icon: 'tune',         label: 'Settings'      },
];

const ADMIN_ITEMS = [
  { id: 'admin',       to: '/admin',       end: true, icon: 'admin_panel_settings', label: 'Overview'     },
  { id: 'admin-users', to: '/admin/users',            icon: 'people',               label: 'Users'        },
  { id: 'admin-jobs',  to: '/admin/jobs',             icon: 'work',                 label: 'Manage Jobs'  },
];

export default function Sidebar({ collapsed, mobileOpen, onClose }) {
  const { user, signOut } = useAuth();
  const isAdmin = user?.role === 'admin';

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const avatarSrc   =
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff&size=36&bold=true`;

  function navLink(item) {
    return (
      <li key={item.id} className="sidebar__nav-item">
        <NavLink
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `sidebar__nav-link${isActive ? ' sidebar__nav-link--active' : ''}`
          }
          data-tooltip={item.label}
          onClick={() => { if (mobileOpen) onClose(); }}
        >
          <span className="sidebar__nav-icon-wrap">
            <span className="material-icons">{item.icon}</span>
          </span>
          <span className="sidebar__nav-label">{item.label}</span>
          {item.badge != null && <span className="badge">{item.badge}</span>}
        </NavLink>
      </li>
    );
  }

  return (
    <>
      <div
        className={`sidebar-backdrop ${mobileOpen ? 'sidebar-backdrop--visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={[
          'sidebar',
          collapsed  ? 'sidebar--collapsed' : '',
          mobileOpen ? 'sidebar--open'      : '',
        ].join(' ')}
      >
        {/* ── Brand ──────────────────────────────────────────── */}
        <div className="sidebar__brand">
          <span className="material-icons sidebar__brand-icon">work</span>
          <span className="sidebar__brand-name">JobHub</span>
        </div>

        {/* ── Primary nav ────────────────────────────────────── */}
        <nav className="sidebar__nav" aria-label="Primary navigation">
          <ul className="sidebar__nav-list">
            {NAV_ITEMS.map(navLink)}
          </ul>

          {/* ── Admin section (admins only) ─────────────────── */}
          {isAdmin && (
            <>
              <div className="sidebar__section-divider">
                <span className="sidebar__section-label">Admin</span>
              </div>
              <ul className="sidebar__nav-list">
                {ADMIN_ITEMS.map(navLink)}
              </ul>
            </>
          )}
        </nav>

        {/* ── Footer ─────────────────────────────────────────── */}
        <div className="sidebar__footer">
          {user && (
            <div className="sidebar__user">
              <img src={avatarSrc} alt={displayName} className="sidebar__user-avatar" />
              <div className="sidebar__user-info">
                <span className="sidebar__user-name">{displayName}</span>
                {isAdmin && <span className="sidebar__user-role">Admin</span>}
              </div>
            </div>
          )}

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `sidebar__nav-link${isActive ? ' sidebar__nav-link--active' : ''}`
            }
            data-tooltip="Settings"
            onClick={() => { if (mobileOpen) onClose(); }}
          >
            <span className="sidebar__nav-icon-wrap">
              <span className="material-icons">account_circle</span>
            </span>
            <span className="sidebar__nav-label">Profile</span>
          </NavLink>

          <button
            className="sidebar__nav-link sidebar__nav-link--danger"
            data-tooltip="Logout"
            onClick={signOut}
          >
            <span className="sidebar__nav-icon-wrap">
              <span className="material-icons">logout</span>
            </span>
            <span className="sidebar__nav-label">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
