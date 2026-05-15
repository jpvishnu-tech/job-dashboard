import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';
import './LoginPage.css';

// view: 'login' | 'register' | 'forgot'
export default function LoginPage() {
  const { login, register, sendPasswordReset } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || '/';

  const [view,     setView]     = useState('login');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [fields, setFields] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formErr, setFormErr] = useState('');
  const [success, setSuccess] = useState(location.state?.successMessage || '');

  const set = useCallback((field) => (e) => {
    setFields((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    setFormErr('');
  }, []);

  function switchView(next) {
    setView(next);
    setErrors({});
    setFormErr('');
    setSuccess('');
    setShowPass(false);
  }

  // ── Auth submit (login / register) ───────────────────────────

  function validateAuthForm() {
    const next = {};
    if (view === 'register') {
      if (!fields.name.trim()) next.name = 'Name is required';
      else if (fields.name.trim().length > 80) next.name = 'Name cannot exceed 80 characters';
    }
    if (!fields.email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) next.email = 'Enter a valid email';
    if (!fields.password) next.password = 'Password is required';
    else if (view === 'register' && fields.password.length < 8)
      next.password = 'Password must be at least 8 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    if (!validateAuthForm()) return;

    setLoading(true);
    setFormErr('');
    try {
      if (view === 'login') {
        await login(fields.email, fields.password);
      } else {
        await register(fields.name, fields.email, fields.password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      // 202 = email confirmation required — treat as a success message, not an error
      if (err instanceof ApiError && err.status === 202) {
        setSuccess(err.message);
        return;
      }
      if (err instanceof ApiError && err.errors?.length) {
        const m = {};
        err.errors.forEach(({ path, msg }) => { m[path] = msg; });
        setErrors(m);
      } else {
        setFormErr(err instanceof ApiError ? err.message : 'Something went wrong — please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Forgot password submit ────────────────────────────────────

  async function handleForgotSubmit(e) {
    e.preventDefault();
    if (!fields.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      setErrors({ email: 'Enter a valid email' });
      return;
    }

    setLoading(true);
    setFormErr('');
    try {
      await sendPasswordReset(fields.email);
      setSuccess('If that email is registered you will receive a reset link shortly.');
    } catch (err) {
      setFormErr(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────

  const isForgot = view === 'forgot';

  return (
    <div className="login-page">
      <div className="login-card">

        {/* Brand */}
        <div className="login-brand">
          <div className="login-brand__icon">
            <span className="material-icons">work</span>
          </div>
          <div>
            <div className="login-brand__name">JobDash</div>
            <div className="login-brand__tagline">Your career command center</div>
          </div>
        </div>

        {/* Tabs — hidden on forgot view */}
        {!isForgot && (
          <div className="login-tabs">
            <button type="button"
              className={`login-tabs__btn${view === 'login' ? ' login-tabs__btn--active' : ''}`}
              onClick={() => switchView('login')}>Sign In</button>
            <button type="button"
              className={`login-tabs__btn${view === 'register' ? ' login-tabs__btn--active' : ''}`}
              onClick={() => switchView('register')}>Create Account</button>
          </div>
        )}

        {/* Forgot-password header */}
        {isForgot && (
          <div>
            <button type="button" className="login-back-btn" onClick={() => switchView('login')}>
              <span className="material-icons">arrow_back</span> Back to sign in
            </button>
            <h2 className="login-section-title">Reset your password</h2>
            <p className="login-section-sub">Enter your email and we&apos;ll send you a reset link.</p>
          </div>
        )}

        {/* Success banner */}
        {success && (
          <div className="login-success">
            <span className="material-icons">check_circle</span>
            {success}
          </div>
        )}

        {/* ── Forgot password form ───────────────────────────── */}
        {isForgot && !success && (
          <form className="login-form" onSubmit={handleForgotSubmit} noValidate>
            {formErr && (
              <div className="login-error">
                <span className="material-icons">error_outline</span>
                {formErr}
              </div>
            )}
            <div className="login-field">
              <label className="login-field__label" htmlFor="lp-fp-email">Email address</label>
              <div className="login-field__input-wrap">
                <input
                  id="lp-fp-email"
                  type="email"
                  className={`login-field__input${errors.email ? ' login-field__input--error' : ''}`}
                  placeholder="jane@example.com"
                  value={fields.email}
                  onChange={set('email')}
                  autoComplete="email"
                  disabled={loading}
                  autoFocus
                />
              </div>
              {errors.email && (
                <span className="login-field__error">
                  <span className="material-icons">error_outline</span>
                  {errors.email}
                </span>
              )}
            </div>
            <button type="submit" className="login-submit" disabled={loading}>
              {loading
                ? <><div className="login-submit__spinner" /> Sending link…</>
                : 'Send Reset Link'
              }
            </button>
          </form>
        )}

        {/* ── Login / Register form ──────────────────────────── */}
        {!isForgot && (
          <form className="login-form" onSubmit={handleAuthSubmit} noValidate>
            {formErr && (
              <div className="login-error">
                <span className="material-icons">error_outline</span>
                {formErr}
              </div>
            )}

            {/* Name — register only */}
            {view === 'register' && (
              <div className="login-field">
                <label className="login-field__label" htmlFor="lp-name">Full Name</label>
                <div className="login-field__input-wrap">
                  <input id="lp-name" type="text"
                    className={`login-field__input${errors.name ? ' login-field__input--error' : ''}`}
                    placeholder="Jane Smith" value={fields.name}
                    onChange={set('name')} autoComplete="name" disabled={loading} />
                </div>
                {errors.name && (
                  <span className="login-field__error">
                    <span className="material-icons">error_outline</span>{errors.name}
                  </span>
                )}
              </div>
            )}

            {/* Email */}
            <div className="login-field">
              <label className="login-field__label" htmlFor="lp-email">Email</label>
              <div className="login-field__input-wrap">
                <input id="lp-email" type="email"
                  className={`login-field__input${errors.email ? ' login-field__input--error' : ''}`}
                  placeholder="jane@example.com" value={fields.email}
                  onChange={set('email')} autoComplete="email" disabled={loading} />
              </div>
              {errors.email && (
                <span className="login-field__error">
                  <span className="material-icons">error_outline</span>{errors.email}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="login-field">
              <div className="login-field__label-row">
                <label className="login-field__label" htmlFor="lp-password">Password</label>
                {view === 'login' && (
                  <button type="button" className="login-forgot-link"
                    onClick={() => switchView('forgot')}>
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="login-field__input-wrap">
                <input id="lp-password"
                  type={showPass ? 'text' : 'password'}
                  className={`login-field__input login-field__input--has-toggle${errors.password ? ' login-field__input--error' : ''}`}
                  placeholder={view === 'register' ? 'Min. 8 characters' : '••••••••'}
                  value={fields.password} onChange={set('password')}
                  autoComplete={view === 'register' ? 'new-password' : 'current-password'}
                  disabled={loading} />
                <button type="button" className="login-field__toggle"
                  onClick={() => setShowPass((v) => !v)} tabIndex={-1}
                  aria-label={showPass ? 'Hide password' : 'Show password'}>
                  <span className="material-icons">{showPass ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {errors.password && (
                <span className="login-field__error">
                  <span className="material-icons">error_outline</span>{errors.password}
                </span>
              )}
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading
                ? <><div className="login-submit__spinner" /> {view === 'login' ? 'Signing in…' : 'Creating account…'}</>
                : view === 'login' ? 'Sign In' : 'Create Account'
              }
            </button>
          </form>
        )}

        {/* Footer */}
        {!isForgot && (
          <p className="login-footer">
            {view === 'login'
              ? <>Don&apos;t have an account?{' '}
                  <button type="button" className="login-footer__link" onClick={() => switchView('register')}>
                    Create one
                  </button>
                </>
              : <>Already have an account?{' '}
                  <button type="button" className="login-footer__link" onClick={() => switchView('login')}>
                    Sign in
                  </button>
                </>
            }
          </p>
        )}

      </div>
    </div>
  );
}
