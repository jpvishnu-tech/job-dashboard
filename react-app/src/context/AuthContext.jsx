import {
  createContext, useContext, useState,
  useEffect, useCallback,
} from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase-config';
import { api, ApiError, getToken, setToken } from '../services/api';

/**
 * AuthContext
 * ─────────────────────────────────────────────────────────────
 * Supports two auth modes — selected automatically:
 *
 *   Firebase mode  (VITE_FIREBASE_API_KEY is set)
 *     • Firebase email/password handles signup, login, logout.
 *     • onAuthStateChanged restores sessions across page reloads
 *       using IndexedDB — no localStorage token needed.
 *     • On every Firebase auth event the app exchanges the Firebase
 *       ID token for a backend JWT used for all API data calls.
 *
 *   JWT-only mode  (Firebase not configured)
 *     • Falls back to the original backend-JWT flow.
 *     • session restored from localStorage on mount via /api/auth/me.
 *
 * Consumer API is identical in both modes — components never need
 * to know which mode is active.
 */

// ── Firebase error → friendly message ─────────────────────────
function mapFirebaseError(err) {
  const map = {
    'auth/user-not-found':         'No account found with this email.',
    'auth/wrong-password':         'Incorrect password.',
    'auth/invalid-credential':     'Incorrect email or password.',
    'auth/email-already-in-use':   'An account with this email already exists.',
    'auth/weak-password':          'Password must be at least 6 characters.',
    'auth/invalid-email':          'Enter a valid email address.',
    'auth/too-many-requests':      'Too many attempts — please try again later.',
    'auth/network-request-failed': 'Network error — check your connection.',
    'auth/user-disabled':          'This account has been disabled.',
  };
  const msg = map[err.code] ?? err.message ?? 'Authentication failed.';
  return new ApiError(msg, err.code === 'auth/wrong-password' ? 401 : 400);
}

// ── Context ────────────────────────────────────────────────────
const AuthContext = createContext({
  user:                    null,
  loading:                 true,
  applications:            [],
  login:                   async () => {},
  register:                async () => {},
  logout:                  async () => {},
  signOut:                 async () => {},
  saveApplication:         async () => {},
  updateApplicationStatus: async () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user,         setUser]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [applications, setApplications] = useState([]);

  // ── Session restore ───────────────────────────────────────────────────────────

  useEffect(() => {
    // ── Firebase mode ─────────────────────────────────────────
    if (isFirebaseConfigured && auth) {
      // onAuthStateChanged fires immediately with the persisted user (if any),
      // then again whenever auth state changes.  It is the single source of
      // truth for session state in Firebase mode.
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          try {
            // Exchange Firebase ID token for a backend JWT
            const idToken   = await fbUser.getIdToken();
            const { token, user: u } = await api.post('/auth/firebase', { idToken });
            setToken(token);
            setUser(u);
            await loadApplications();
          } catch {
            // Token invalid or backend unreachable — sign out cleanly
            await firebaseSignOut(auth).catch(() => {});
            setToken(null);
            setUser(null);
            setApplications([]);
          }
        } else {
          setToken(null);
          setUser(null);
          setApplications([]);
        }
        setLoading(false);
      });

      return unsubscribe; // cleaned up on unmount
    }

    // ── JWT-only fallback ─────────────────────────────────────
    if (!getToken()) { setLoading(false); return; }

    api.get('/auth/me')
      .then(({ user: u }) => {
        setUser(u);
        return loadApplications();
      })
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Global 401 handler ────────────────────────────────────────────────────────
  useEffect(() => {
    async function handleForcedLogout() {
      if (isFirebaseConfigured && auth) {
        await firebaseSignOut(auth).catch(() => {});
      }
      setUser(null);
      setApplications([]);
    }
    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────────

  async function loadApplications() {
    try {
      const { data } = await api.get('/users/applications?limit=100');
      setApplications(data ?? []);
    } catch (err) {
      console.warn('[auth] Could not load applications:', err.message);
    }
  }

  // ── Auth actions ──────────────────────────────────────────────────────────────

  const login = useCallback(async (email, password) => {
    // Firebase mode
    if (isFirebaseConfigured && auth) {
      try {
        const cred    = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await cred.user.getIdToken();
        const { token, user: u } = await api.post('/auth/firebase', { idToken });
        setToken(token);
        setUser(u);
        await loadApplications();
      } catch (err) {
        throw err.code ? mapFirebaseError(err) : err;
      }
      return;
    }

    // JWT-only fallback
    const { token, user: u } = await api.post('/auth/login', { email, password });
    setToken(token);
    setUser(u);
    await loadApplications();
  }, []);

  const register = useCallback(async (name, email, password) => {
    // Firebase mode
    if (isFirebaseConfigured && auth) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        // Persist display name on the Firebase user profile
        await updateProfile(cred.user, { displayName: name });
        // Force token refresh so displayName is included in the new ID token
        const idToken = await cred.user.getIdToken(true);
        const { token, user: u } = await api.post('/auth/firebase', { idToken });
        setToken(token);
        setUser(u);
      } catch (err) {
        throw err.code ? mapFirebaseError(err) : err;
      }
      return;
    }

    // JWT-only fallback
    const { token, user: u } = await api.post('/auth/register', { name, email, password });
    setToken(token);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    if (isFirebaseConfigured && auth) {
      await firebaseSignOut(auth).catch(() => {});
    } else {
      await api.post('/auth/logout').catch(() => {});
    }
    setToken(null);
    setUser(null);
    setApplications([]);
  }, []);

  // ── Application CRUD ──────────────────────────────────────────────────────────

  const saveApplication = useCallback(async (job) => {
    if (!user) return;

    const tempId  = `temp-${Date.now()}`;
    const tempApp = { ...job, status: 'pending', appliedAt: new Date().toISOString(), _id: tempId };

    setApplications((prev) => [
      ...prev.filter((a) => a.url !== job.url),
      tempApp,
    ]);

    try {
      const { data } = await api.post('/users/applications', {
        company:  job.company  ?? '',
        role:     job.role     ?? '',
        location: job.location ?? '',
        salary:   job.salary   ?? '',
        type:     job.type     ?? '',
        url:      job.url,
        status:   'pending',
      });
      setApplications((prev) => [
        ...prev.filter((a) => a._id !== tempId),
        data,
      ]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) return;
      setApplications((prev) => prev.filter((a) => a._id !== tempId));
      console.error('[auth] saveApplication failed:', err.message);
    }
  }, [user]);

  const updateApplicationStatus = useCallback(async (url, newStatus) => {
    if (!user) return;

    const app = applications.find((a) => a.url === url);
    if (!app) return;

    setApplications((prev) =>
      prev.map((a) => (a.url === url ? { ...a, status: newStatus } : a))
    );

    try {
      await api.put(`/users/applications/${app._id}`, { status: newStatus });
    } catch (err) {
      setApplications((prev) =>
        prev.map((a) => (a.url === url ? { ...a, status: app.status } : a))
      );
      console.error('[auth] updateApplicationStatus failed:', err.message);
    }
  }, [user, applications]);

  const signOut = logout; // alias for Sidebar/Navbar compatibility

  return (
    <AuthContext.Provider value={{
      user, loading, applications,
      login, register, logout, signOut,
      saveApplication, updateApplicationStatus,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Consumer hook ─────────────────────────────────────────────────────────────
export const useAuth = () => useContext(AuthContext);
