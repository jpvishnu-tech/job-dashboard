import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import './NotificationBell.css';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  function handleItemClick(notif) {
    if (!notif.read) markRead(notif._id);
  }

  return (
    <div className="notif-bell" ref={ref}>
      <button
        className="notif-bell__btn"
        onClick={() => setOpen(o => !o)}
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
      >
        <span className="material-icons">notifications</span>
        {unreadCount > 0 && (
          <span className="notif-bell__badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown__header">
            <h3 className="notif-dropdown__title">
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </h3>
            <div className="notif-dropdown__actions">
              {unreadCount > 0 && (
                <button className="notif-dropdown__action-btn" onClick={markAllRead}>
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  className="notif-dropdown__action-btn notif-dropdown__action-btn--danger"
                  onClick={() => { clearAll(); setOpen(false); }}
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="notif-dropdown__list">
            {notifications.length === 0 ? (
              <div className="notif-dropdown__empty">
                <span className="material-icons">notifications_none</span>
                No notifications yet
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif._id}
                  className={`notif-item${notif.read ? ' notif-item--read' : ' notif-item--unread'}`}
                  onClick={() => handleItemClick(notif)}
                >
                  <span className="notif-item__dot" />
                  <div className="notif-item__body">
                    <p className="notif-item__title">{notif.title}</p>
                    <p className="notif-item__message">{notif.message}</p>
                    <span className="notif-item__time">{timeAgo(notif.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
