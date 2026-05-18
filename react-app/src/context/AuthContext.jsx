import {
  createContext, useContext, useState,
  useEffect, useCallback,
} from 'react';
import { supabase } from '../lib/supabase';
import { ApiError } from '../services/api';

// ── Supabase error → friendly message ──────────────────────────
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

// ── Normalise Supabase user → app user shape ───────────────────
function toProfile(supaUser) {
  const displayName =
    supaUser.user_metadata?.full_name ||
    supaUser.email?.split('@')[0] ||
    'User';
  return {
    id:          supaUser.id,
    _id:         supaUser.id,          // admin page compatibility
    email:       supaUser.email,
    name:        displayName,          // Sidebar reads user.name
    displayName,                       // SettingsPage reads user.displayName
    avatar:      supaUser.user_metadata?.avatar_url ?? null,   // Sidebar
    photoURL:    supaUser.user_metadata?.avatar_url ?? null,   // SettingsPage
    role:        supaUser.app_metadata?.role ?? 'user',
  };
}

// ── Applications — persisted in localStorage per user ──────────
const appsKey    = (uid)       => `jdApps_${uid}`;
const loadApps   = (uid)       => {
  try { return JSON.parse(localStorage.getItem(appsKey(uid)) ?? '[]'); }
  catch { return []; }
};
const persistApps = (uid, arr) => localStorage.setItem(appsKey(uid), JSON.stringify(arr));

// ── Context ─────────────────────────────────────────────────────
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

// ── Provider ─────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user,         setUser]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [applications, setApplications] = useState([]);

  // ── Session persistence via onAuthStateChange ─────────────────
  // Covers: page reload, sign-in, sign-out, token refresh.
  useEffect(() => {
    if (!supabase) {
      console.error('[Auth] Supabase not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          const profile = toProfile(session.user);
          setUser(profile);
          setApplications(loadApps(session.user.id));
        } else {
          setUser(null);
          setApplications([]);
        }
        setLoading(false);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Auth actions ──────────────────────────────────────────────

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new ApiError(mapSupabaseError(error), 401);
    // onAuthStateChange will also fire; setting state here too avoids a
    // brief flash of "loading" between signInWithPassword resolving and the
    // auth state change event firing.
    const profile = toProfile(data.user);
    setUser(profile);
    setApplications(loadApps(data.user.id));
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) throw new ApiError(mapSupabaseError(error), 400);

    // Email confirmation required — session is null until user clicks the link.
    // Throw a 202 ApiError so LoginPage can show it as a success message.
    if (!data.session) {
      throw new ApiError(
        'Account created! Please check your email to confirm your address before signing in.',
        202,
      );
    }

    const profile = toProfile(data.user);
    setUser(profile);
    setApplications(loadApps(data.user.id));
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut().catch(() => {});
    setUser(null);
    setApplications([]);
  }, []);

  const sendPasswordReset = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new ApiError(mapSupabaseError(error), 400);
  }, []);

  // ── Application CRUD — localStorage, scoped to user ──────────

  const saveApplication = useCallback(async (job) => {
    if (!user) return;
    setApplications((prev) => {
      const next = [
        ...prev.filter((a) => a.url !== job.url),
        {
          company:   job.company  ?? '',
          role:      job.role     ?? '',
          location:  job.location ?? '',
          salary:    job.salary   ?? '',
          type:      job.type     ?? '',
          url:       job.url,
          status:    'pending',
          appliedAt: new Date().toISOString(),
          _id:       `app-${Date.now()}`,
        },
      ];
      persistApps(user.id, next);
      return next;
    });
  }, [user]);

  const updateApplicationStatus = useCallback(async (url, newStatus) => {
    if (!user) return;
    setApplications((prev) => {
      const next = prev.map((a) => (a.url === url ? { ...a, status: newStatus } : a));
      persistApps(user.id, next);
      return next;
    });
  }, [user]);

  const signOut = logout;

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

export const useAuth = () => useContext(AuthContext);
