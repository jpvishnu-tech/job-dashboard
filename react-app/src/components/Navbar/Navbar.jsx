import { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth }  from '../../context/AuthContext';
import './Navbar.css';

// Hard-coded demo notifications — in a real app these would come from Firestore.
const DEMO_NOTIFICATIONS = [
  { id: 1, icon: 'event',       iconCls: 'notif-item__icon--blue',   text: <>Interview scheduled at <strong>Figma</strong></>,     time: '2 hours ago',  unread: true  },
  { id: 2, icon: 'check_circle',iconCls: 'notif-item__icon--green',  text: <>Application <strong>shortlisted</strong> by Stripe</>, time: '5 hours ago',  unread: true  },
  { id: 3, icon: 'description',  iconCls: 'notif-item__icon--purple', text: <>Your resume was <strong>viewed</strong> by Vercel</>,  time: 'Yesterday',    unread: false },
  { id: 4, icon: 'work',         iconCls: 'notif-item__icon--orange', text: <>5 new jobs match your profile</>,                     time: '2 days ago',   unread: false },
];

/**
 * Navbar
 * ─────────────────────────────────────────────────────────────
 * Props:
 *   onSidebarToggle() – called when the hamburger is clicked; App decides
 *                       whether to collapse (desktop) or slide-in (mobile).
 *   jobs              – full jobs array from useJobs; used to power the
 *                       global search overlay.
 *   onJobSelect(job)  – called when the user clicks a search result; App
 *                       can scroll/highlight the matching row.
 */
export default function Navbar({ onSidebarToggle, jobs, onJobSelect }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, signOut }       = useAuth();

  // ── Search state ────────────────────────────────────────────
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [overlayOpen,   setOverlayOpen]   = useState(false);
  const [focusIdx,      setFocusIdx]      = useState(-1); // keyboard-selected item
  const searchInputRef = useRef(null);

  // ── Dropdown state ───────────────────────────────────────────
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [userOpen,     setUserOpen]     = useState(false);
  const [notifRead,    setNotifRead]    = useState(false); // true after "Mark all read"
  const notifRef  = useRef(null);
  const userRef   = useRef(null);

  // ── User display info ────────────────────────────────────────
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Alex Johnson';
  const avatarSrc   =
    user?.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff&size=36&bold=true`;

  // ── Close dropdowns when clicking outside ───────────────────
  // A single document-level listener handles both dropdowns and the search
  // overlay, preventing multiple competing listeners.
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userRef.current  && !userRef.current.contains(e.target))  setUserOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Ctrl/Cmd+K shortcut ──────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // ── Search logic ─────────────────────────────────────────────
  // Runs on every keystroke.  Filters the jobs array passed from App
  // and limits results to 5 to keep the overlay compact.
  const runSearch = useCallback((q) => {
    setSearchQuery(q);
    setFocusIdx(-1);

    if (!q.trim()) {
      setSearchResults([]);
      setOverlayOpen(false);
      return;
    }

    const ql = q.toLowerCase();
    const matches = jobs
      .filter((j) =>
        [j.company, j.role, j.dept, j.location, j.type.label]
          .some((field) => field.toLowerCase().includes(ql))
      )
      .slice(0, 5); // cap at 5 results

    setSearchResults(matches);
    setOverlayOpen(true);
  }, [jobs]);

  // Highlight query matches in a plain string by wrapping them in <mark>.
  function highlight(text, q) {
    if (!q) return text;
    const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === q.toLowerCase()
        ? <mark key={i} className="search-mark">{part}</mark>
        : part
    );
  }

  // ── Search keyboard navigation ───────────────────────────────
  const handleSearchKeyDown = (e) => {
    if (!overlayOpen || !searchResults.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIdx((i) => Math.min(i + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && focusIdx >= 0) {
      e.preventDefault();
      selectResult(searchResults[focusIdx]);
    } else if (e.key === 'Escape') {
      closeOverlay();
    }
  };

  const selectResult = (job) => {
    closeOverlay();
    onJobSelect?.(job); // notify App so it can highlight the row
  };

  const closeOverlay = () => {
    setOverlayOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setFocusIdx(-1);
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <header className="navbar">

      {/* Hamburger — collapses sidebar on desktop, slides it in on mobile */}
      <button
        className="navbar__toggle"
        onClick={onSidebarToggle}
        aria-label="Toggle sidebar"
      >
        <span className="material-icons">menu</span>
      </button>

      {/* ── Global search ──────────────────────────────────────── */}
      <div className="navbar__search">
        <span className="material-icons navbar__search-icon">search</span>

        <input
          ref={searchInputRef}
          type="text"
          className="navbar__search-input"
          placeholder="Search jobs, companies…"
          autoComplete="off"
          value={searchQuery}
          onChange={(e) => runSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          // Close the overlay when focus leaves the search area entirely
          onBlur={() => setTimeout(() => setOverlayOpen(false), 150)}
          onFocus={() => { if (searchResults.length) setOverlayOpen(true); }}
          aria-label="Search jobs"
        />

        {/* Keyboard shortcut hint — hidden while typing */}
        {!searchQuery && <kbd className="navbar__search-kbd">Ctrl K</kbd>}

        {/* Clear button — shown only when the input has a value */}
        {searchQuery && (
          <button
            className="navbar__search-clear"
            onClick={closeOverlay}
            aria-label="Clear search"
          >
            <span className="material-icons">close</span>
          </button>
        )}

        {/* ── Search results overlay ── */}
        {overlayOpen && (
          <div className="search-overlay" role="listbox" aria-label="Search results">
            {searchResults.length === 0 ? (
              <div className="search-overlay__empty">
                <span className="material-icons">search_off</span>
                No results for "{searchQuery}"
              </div>
            ) : (
              <>
                {searchResults.map((job, i) => (
                  <div
                    key={job.id}
                    role="option"
                    className={`search-result ${focusIdx === i ? 'search-result--focused' : ''}`}
                    // mousedown fires before blur, so we can read the click before
                    // the input loses focus and hides the overlay.
                    onMouseDown={(e) => { e.preventDefault(); selectResult(job); }}
                  >
                    <img
                      src={job.logoUrl}
                      alt={job.company}
                      className="search-result__logo"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=6366f1&color=fff&size=32`;
                      }}
                    />
                    <div className="search-result__info">
                      <span className="search-result__role">
                        {highlight(job.role, searchQuery)}
                      </span>
                      <span className="search-result__meta">
                        {highlight(job.company, searchQuery)} · {job.location}
                      </span>
                    </div>
                    <span className={`type-badge ${job.type.cls}`}>{job.type.label}</span>
                  </div>
                ))}

                {/* "See all" footer — clears search so the table shows all jobs */}
                <div className="search-overlay__footer">
                  <button className="search-overlay__see-all" onClick={closeOverlay}>
                    <span className="material-icons">open_in_new</span>
                    See all results
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Right-side action icons ─────────────────────────────── */}
      <div className="navbar__actions">

        {/* Dark / light mode toggle — sliding pill with sun + moon */}
        <button
          className="theme-toggle"
          role="switch"
          aria-checked={isDark}
          aria-label="Toggle dark mode"
          onClick={toggleTheme}
        >
          <span className="material-icons theme-toggle__icon--sun">light_mode</span>
          <span className="theme-toggle__thumb" />
          <span className="material-icons theme-toggle__icon--moon">dark_mode</span>
        </button>

        {/* ── Notifications dropdown ─────────────────────────────── */}
        <div className="navbar__notif-wrap" ref={notifRef}>
          <button
            className="navbar__icon-btn"
            aria-label="Notifications"
            aria-expanded={notifOpen}
            onClick={() => { setNotifOpen((o) => !o); setUserOpen(false); }}
          >
            <span className="material-icons">notifications_none</span>
            {/* Pulsing red dot — hidden after "Mark all read" */}
            {!notifRead && <span className="navbar__notif-dot" />}
          </button>

          {notifOpen && (
            <div className="notif-panel">
              <div className="notif-panel__head">
                <span className="notif-panel__title">Notifications</span>
                <button
                  className="notif-panel__mark-all"
                  onClick={() => setNotifRead(true)}
                >
                  Mark all read
                </button>
              </div>

              <ul className="notif-list">
                {DEMO_NOTIFICATIONS.map((n) => (
                  <li
                    key={n.id}
                    className={`notif-item ${n.unread && !notifRead ? 'notif-item--unread' : ''}`}
                  >
                    <div className={`notif-item__icon ${n.iconCls}`}>
                      <span className="material-icons">{n.icon}</span>
                    </div>
                    <div className="notif-item__body">
                      <p className="notif-item__text">{n.text}</p>
                      <span className="notif-item__time">{n.time}</span>
                    </div>
                    {n.unread && !notifRead && <span className="notif-item__unread-dot" />}
                  </li>
                ))}
              </ul>

              <div className="notif-panel__footer">
                <a href="#" className="notif-panel__view-all">View all notifications</a>
              </div>
            </div>
          )}
        </div>

        <div className="navbar__divider" />

        {/* ── User profile dropdown ───────────────────────────────── */}
        <div className="navbar__user-wrap" ref={userRef}>
          <button
            className="navbar__user"
            aria-expanded={userOpen}
            onClick={() => { setUserOpen((o) => !o); setNotifOpen(false); }}
          >
            <img src={avatarSrc} alt={displayName} className="navbar__avatar" />
            <div className="navbar__user-info">
              <span className="navbar__user-name">{displayName}</span>
              <span className="navbar__user-role">Job Seeker</span>
            </div>
            <span className={`material-icons navbar__user-caret ${userOpen ? 'navbar__user-caret--open' : ''}`}>
              expand_more
            </span>
          </button>

          {userOpen && (
            <div className="user-panel">
              <div className="user-panel__head">
                <img src={avatarSrc} alt={displayName} className="user-panel__avatar" />
                <div className="user-panel__info">
                  <span className="user-panel__name">{displayName}</span>
                  <span className="user-panel__email">{user?.email || 'demo@jobhub.io'}</span>
                </div>
              </div>

              <ul className="user-panel__menu">
                {[
                  { icon: 'person_outline', label: 'My Profile' },
                  { icon: 'article',        label: 'My Resume'  },
                  { icon: 'tune',           label: 'Settings'   },
                ].map((item) => (
                  <li key={item.label}>
                    <a href="#" className="user-panel__link">
                      <span className="material-icons">{item.icon}</span>
                      {item.label}
                    </a>
                  </li>
                ))}
                <li className="user-panel__divider" />
                <li>
                  <button
                    className="user-panel__link user-panel__link--danger"
                    onClick={signOut}
                  >
                    <span className="material-icons">logout</span>
                    Sign out
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
