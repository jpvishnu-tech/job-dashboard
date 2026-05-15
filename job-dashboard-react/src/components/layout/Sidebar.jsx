import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/dashboard',    icon: 'dashboard',    label: 'Dashboard'    },
  { to: '/jobs',         icon: 'work',         label: 'Jobs'         },
  { to: '/applications', icon: 'assignment',   label: 'Applications' },
  { to: '/automation',   icon: 'auto_awesome',      label: 'Automation'   },
  { to: '/career',       icon: 'psychology_alt',    label: 'Career AI'    },
  { to: '/resume',       icon: 'description',       label: 'Resume'       },
  { to: '/auto-apply',  icon: 'bolt',              label: 'Smart Apply'  },
  { to: '/workflow',    icon: 'account_tree',      label: 'Workflow'     },
];

const RECRUITER_ITEMS = [
  { to: '/recruiter',              icon: 'business_center', label: 'Recruiter Home' },
  { to: '/recruiter/jobs',         icon: 'post_add',        label: 'Manage Jobs'    },
  { to: '/recruiter/applicants',   icon: 'people',          label: 'Applicants'     },
  { to: '/recruiter/interviews',   icon: 'event',           label: 'Interviews'     },
  { to: '/recruiter/company',      icon: 'corporate_fare',  label: 'Company'        },
];

const FOOTER_ITEMS = [
  { to: '/billing',  icon: 'credit_card', label: 'Billing'  },
  { to: '/settings', icon: 'settings',    label: 'Settings' },
];

function NavItem({ to, icon, label, collapsed, onClick }) {
  return (
    <li className="sidebar__nav-item">
      <NavLink
        to={to}
        className={({ isActive }) =>
          `sidebar__nav-link${isActive ? ' sidebar__nav-link--active' : ''}`
        }
        onClick={onClick}
        title={collapsed ? label : undefined}
      >
        <span className="sidebar__nav-icon-wrap">
          <span className="material-icons">{icon}</span>
        </span>
        <span className="sidebar__nav-label">{label}</span>
      </NavLink>
    </li>
  );
}

export default function Sidebar({ collapsed, mobileOpen, onClose }) {
  const { user, isAdmin, isRecruiter, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const initials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${mobileOpen ? 'sidebar--open' : ''}`}>
      {/* Logo */}
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon">
          <span className="material-icons">work</span>
        </div>
        <span className="sidebar__logo-text">JobTracker</span>
      </div>

      {/* Main nav */}
      <nav className="sidebar__nav">
        <ul className="sidebar__nav-list">
          {NAV_ITEMS.map(item => (
            <NavItem key={item.to} {...item} collapsed={collapsed} onClick={onClose} />
          ))}

          {/* Admin link */}
          {isAdmin && (
            <NavItem to="/admin" icon="admin_panel_settings" label="Admin" collapsed={collapsed} onClick={onClose} />
          )}
        </ul>

        {/* Recruiter section — shown for recruiters and admins */}
        {(isRecruiter || isAdmin) && (
          <>
            {!collapsed && (
              <div style={{
                padding: '12px 16px 4px',
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--sidebar-muted, #94a3b8)',
              }}>
                Recruiter Portal
              </div>
            )}
            <ul className="sidebar__nav-list">
              {RECRUITER_ITEMS.map(item => (
                <NavItem key={item.to} {...item} collapsed={collapsed} onClick={onClose} />
              ))}
            </ul>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="sidebar__footer">
        {FOOTER_ITEMS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar__nav-link${isActive ? ' sidebar__nav-link--active' : ''}`
            }
            onClick={onClose}
            title={collapsed ? label : undefined}
          >
            <span className="sidebar__nav-icon-wrap">
              <span className="material-icons">{icon}</span>
            </span>
            <span className="sidebar__nav-label">{label}</span>
          </NavLink>
        ))}

        <div className="sidebar__user">
          <div className="sidebar__avatar">{initials}</div>
          <div className="sidebar__user-info">
            <span className="sidebar__user-name">
              {user?.displayName || user?.email?.split('@')[0] || 'User'}
            </span>
            <span className="sidebar__user-email">{user?.email}</span>
          </div>
          <button
            className="sidebar__logout"
            onClick={handleLogout}
            title="Sign out"
          >
            <span className="material-icons">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
