import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { connectSocket, disconnectSocket } from '../services/socket';

const NotificationContext = createContext(null);

const API = '/api/notifications';

async function apiFetch(path, method = 'GET', getToken, body) {
  const token = await getToken();
  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} failed: ${res.status}`);
  return res.json();
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(false);
  const getToken = useCallback(() => user?.getIdToken(), [user]);
  const socketRef = useRef(null);

  // ── Load initial notifications from REST API ──────────────────
  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiFetch(`${API}?limit=30`, 'GET', getToken);
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.notifications?.filter(n => !n.read).length ?? 0);
    } catch {
      // Non-critical — socket will keep things in sync
    } finally {
      setLoading(false);
    }
  }, [user, getToken]);

  // ── Connect socket + wire events ──────────────────────────────
  useEffect(() => {
    if (!user) {
      disconnectSocket();
      socketRef.current = null;
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    loadNotifications();

    let mounted = true;

    connectSocket(() => user.getIdToken()).then((sock) => {
      if (!mounted) return;
      socketRef.current = sock;

      sock.on('notification:new', (notification) => {
        setNotifications(prev => [notification, ...prev].slice(0, 50));
        setUnreadCount(prev => prev + 1);
      });

      sock.on('notification:unreadCount', ({ count }) => {
        setUnreadCount(count);
      });
    }).catch(() => {});

    return () => {
      mounted = false;
    };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ───────────────────────────────────────────────────

  const markRead = useCallback(async (notificationId) => {
    try {
      await apiFetch(`${API}/${notificationId}/read`, 'PATCH', getToken);
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  }, [getToken]);

  const markAllRead = useCallback(async () => {
    try {
      await apiFetch(`${API}/read-all`, 'PATCH', getToken);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  }, [getToken]);

  const clearAll = useCallback(async () => {
    try {
      await apiFetch(API, 'DELETE', getToken);
      setNotifications([]);
      setUnreadCount(0);
    } catch {}
  }, [getToken]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading, markRead, markAllRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
