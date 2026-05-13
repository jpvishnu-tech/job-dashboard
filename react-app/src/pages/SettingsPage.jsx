import { useAuth }  from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './SettingsPage.css';

/**
 * SettingsPage
 * ─────────────────────────────────────────────────────────────
 * Account settings, appearance, and notification preferences.
 * Save / delete actions are UI-only placeholders — wire them to
 * Firestore updateDoc / Firebase deleteUser for production use.
 */
export default function SettingsPage() {
  const { user, signOut }    = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const avatarSrc   =
    user?.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff&size=64&bold=true`;

  return (
    <>
      <div className="content__header">
        <div>
          <h1 className="content__title">Settings</h1>
          <p className="content__subtitle">Manage your account and preferences.</p>
        </div>
      </div>

      {/* ── Account ────────────────────────────────────────────── */}
      <div className="card settings-card">
        <h2 className="settings-card__title">Account</h2>

        <div className="settings-field settings-field--row settings-field--avatar">
          <div>
            <span className="settings-label">Profile Photo</span>
            <span className="settings-hint">Synced from Google or generated automatically</span>
          </div>
          <img src={avatarSrc} alt={displayName} className="settings-avatar" />
        </div>

        <div className="settings-field">
          <label className="settings-label" htmlFor="s-name">Display Name</label>
          <input
            id="s-name"
            type="text"
            className="settings-input"
            defaultValue={displayName}
            placeholder="Your name"
          />
        </div>

        <div className="settings-field">
          <label className="settings-label" htmlFor="s-email">Email</label>
          <input
            id="s-email"
            type="email"
            className="settings-input"
            defaultValue={user?.email || ''}
            placeholder="your@email.com"
            disabled
          />
          <span className="settings-hint">Email cannot be changed here.</span>
        </div>

        <div className="settings-card__footer">
          <button className="btn btn--primary btn--sm">Save Changes</button>
        </div>
      </div>

      {/* ── Appearance ─────────────────────────────────────────── */}
      <div className="card settings-card">
        <h2 className="settings-card__title">Appearance</h2>

        <div className="settings-field settings-field--row">
          <div>
            <span className="settings-label">Dark Mode</span>
            <span className="settings-hint">Toggle between light and dark theme</span>
          </div>
          <button
            className={`settings-toggle${isDark ? ' settings-toggle--on' : ''}`}
            onClick={toggleTheme}
            role="switch"
            aria-checked={isDark}
            aria-label="Toggle dark mode"
          >
            <span className="settings-toggle__thumb" />
          </button>
        </div>
      </div>

      {/* ── Notifications ──────────────────────────────────────── */}
      <div className="card settings-card">
        <h2 className="settings-card__title">Notifications</h2>

        {[
          { id: 'n1', label: 'New job matches',     hint: 'Notify me when jobs matching my profile are posted', defaultOn: true  },
          { id: 'n2', label: 'Application updates', hint: 'Updates when my application status changes',         defaultOn: true  },
          { id: 'n3', label: 'Interview reminders', hint: 'Reminders 24 hours before scheduled interviews',     defaultOn: true  },
          { id: 'n4', label: 'Weekly digest',       hint: 'Weekly summary of my job search activity',           defaultOn: false },
        ].map((n) => (
          <div key={n.id} className="settings-field settings-field--row">
            <div>
              <span className="settings-label">{n.label}</span>
              <span className="settings-hint">{n.hint}</span>
            </div>
            <label className="settings-checkbox-wrap">
              <input type="checkbox" defaultChecked={n.defaultOn} />
              <span className="settings-checkbox__mark" />
            </label>
          </div>
        ))}
      </div>

      {/* ── Danger zone ────────────────────────────────────────── */}
      <div className="card settings-card settings-card--danger">
        <h2 className="settings-card__title settings-card__title--danger">Danger Zone</h2>

        <div className="settings-field settings-field--row">
          <div>
            <span className="settings-label">Sign out</span>
            <span className="settings-hint">Sign out of your account on this device</span>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={signOut}>Sign out</button>
        </div>

        <div className="settings-field settings-field--row">
          <div>
            <span className="settings-label">Delete Account</span>
            <span className="settings-hint">Permanently delete your account and all data — this cannot be undone</span>
          </div>
          <button className="btn btn--danger btn--sm">Delete Account</button>
        </div>
      </div>
    </>
  );
}
