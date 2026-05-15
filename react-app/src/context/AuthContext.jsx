import {
  createContext, useContext, useState,
  useEffect, useCallback,
} from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { api, ApiError, getToken, setToken } from '../services/api';

/**
 * AuthContext
 * ─────────────────────────────────────────────────────────────
 * Supports two auth modes — selected automatically:
 *
 *   Supabase mode  (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set)
 *     • Supabase email/password handles signup, login, logout.
 *     • onAuthStateChange restores sessions across page reloads.
 *     • On every Supabase auth event the app exchanges the Supabase
 *       access token for a backend JWT used for all API data calls.
 *
 *   JWT-only mode  (Supabase not configured)
 *     • Falls back to the original backend-JWT flow.
 *     • Session restored from localStorage on mount via /api/auth/me.
 *
 * Consumer API is identical in both modes — components never need
 * to know which mode is active.
 */

// ── Supabase error → friendly message ─────────────────────────
function mapSupabaseError(err) {
  const msg = (err.message ?? '').toLowerCase();
  if (msg.includes('invalid login credentials'))        return 'Incorrect email or password.';
  if (msg.includes('email not confirmed'))              return 'Please verify your email before signing in.';
  if (msg.includes('user already registered'))          return 'An account with this email already exists.';
  if (msg.includes('password should be at least'))      return 'Password must be at least 6 characters.';
  if (msg.includes('unable to validate email address')) return 'Enter a valid email address.';
  if (msg.includes('email rate limit exceeded'))        return 'Too many attempts — please try again later.';
  if (msg.includes('network'))                          return 'Network error — check your connection.';
  if (msg.includes('user not found'))                   return 'No account found with this email.';
  if (msg.includes('disabled'))                         return 'This account has been disabled.';
  return err.message ?? 'Authentication failed.';
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
  sendPasswordReset:       async () => {},
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
    // ── Supabase mode ─────────────────────────────────────────
    if (isSupabaseConfigured) {
      // Only handle INITIAL_SESSION (page-load restore).
      // Login/register/logout exchange tokens explicitly in their handlers,
      // which avoids a double-exchange on every sign-in event.
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event !== 'INITIAL_SESSION') return;

          if (session?.access_token) {
            try {
              const { token, user: u } = await api.post('/auth/supabase', {
                access_token: session.access_token,
              });
              setToken(token);
              setUser(u);
              await loadApplications();
            } catch {
              await supabase.auth.signOut().catch(() => {});
              setToken(null);
              setUser(null);
              setApplications([]);
            }
          }

          setLoading(false);
        }
      );

      return () => subscription.unsubscribe();
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
      if (isSupabaseConfigured) {
        await supabase.auth.signOut().catch(() => {});
      }
      setToken(null);
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
    // Supabase mode
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new ApiError(mapSupabaseError(error), 401);
      const { token, user: u } = await api.post('/auth/supabase', {
        access_token: data.session.access_token,
      });
      setToken(token);
      setUser(u);
      await loadApplications();
      return;
    }

    // JWT-only fallback
    const { token, user: u } = await api.post('/auth/login', { email, password });
    setToken(token);
    setUser(u);
    await loadApplications();
  }, []);

  const register = useCallback(async (name, email, password) => {
    // Supabase mode
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) throw new ApiError(mapSupabaseError(error), 400);

      // Email confirmation required — no session yet
      if (!data.session) {
        throw new ApiError(
          'Account created! Please check your email to confirm your address before signing in.',
          202
        );
      }

      const { token, user: u } = await api.post('/auth/supabase', {
        access_token: data.session.access_token,
      });
      setToken(token);
      setUser(u);
      return;
    }

    // JWT-only fallback
    const { token, user: u } = await api.post('/auth/register', { name, email, password });
    setToken(token);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut().catch(() => {});
    } else {
      await api.post('/auth/logout').catch(() => {});
    }
    setToken(null);
    setUser(null);
    setApplications([]);
  }, []);

  const sendPasswordReset = useCallback(async (email) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw new ApiError(mapSupabaseError(error), 400);
    } else {
      await api.post('/auth/forgot-password', { email });
    }
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
      sendPasswordReset,
      saveApplication, updateApplicationStatus,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Consumer hook ─────────────────────────────────────────────────────────────
export const useAuth = () => useContext(AuthContext);
