import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../services/api';
import './LoginPage.css'; // reuse login card styles

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [errors,    setErrors]    = useState({});
  const [formErr,   setFormErr]   = useState('');

  if (!token) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-brand">
            <div className="login-brand__icon">
              <span className="material-icons">work</span>
            </div>
            <div>
              <div className="login-brand__name">JobDash</div>
            </div>
          </div>
          <div className="login-error" style={{ marginTop: 0 }}>
            <span className="material-icons">error_outline</span>
            Invalid reset link. Please request a new one.
          </div>
          <p className="login-footer">
            <button type="button" className="login-footer__link"
              onClick={() => navigate('/login', { state: { view: 'forgot' } })}>
              Request password reset
            </button>
          </p>
        </div>
      </div>
    );
  }

  function validate() {
    const errs = {};
    if (!password)              errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (!confirm)               errs.confirm  = 'Please confirm your password';
    else if (confirm !== password) errs.confirm = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setFormErr('');
    try {
      await api.post('/auth/reset-password', { token, password });
      navigate('/login', {
        replace: true,
        state: { successMessage: 'Password reset successfully. Please sign in.' },
      });
    } catch (err) {
      setFormErr(err instanceof ApiError ? err.message : 'Something went wrong — please try again.');
    } finally {
      setLoading(false);
    }
  }

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

        <div>
          <h2 className="login-section-title">Set a new password</h2>
          <p className="login-section-sub">Choose a strong password for your account.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {formErr && (
            <div className="login-error">
              <span className="material-icons">error_outline</span>
              {formErr}
            </div>
          )}

          {/* New password */}
          <div className="login-field">
            <label className="login-field__label" htmlFor="rp-password">New Password</label>
            <div className="login-field__input-wrap">
              <input
                id="rp-password"
                type={showPass ? 'text' : 'password'}
                className={`login-field__input login-field__input--has-toggle${errors.password ? ' login-field__input--error' : ''}`}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
                autoComplete="new-password"
                disabled={loading}
                autoFocus
              />
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

          {/* Confirm password */}
          <div className="login-field">
            <label className="login-field__label" htmlFor="rp-confirm">Confirm Password</label>
            <div className="login-field__input-wrap">
              <input
                id="rp-confirm"
                type={showPass ? 'text' : 'password'}
                className={`login-field__input${errors.confirm ? ' login-field__input--error' : ''}`}
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setErrors((p) => ({ ...p, confirm: '' })); }}
                autoComplete="new-password"
                disabled={loading}
              />
            </div>
            {errors.confirm && (
              <span className="login-field__error">
                <span className="material-icons">error_outline</span>{errors.confirm}
              </span>
            )}
          </div>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading
              ? <><div className="login-submit__spinner" /> Updating password…</>
              : 'Set New Password'
            }
          </button>
        </form>

        <p className="login-footer">
          Remember it?{' '}
          <button type="button" className="login-footer__link"
            onClick={() => navigate('/login')}>
            Sign in
          </button>
        </p>

      </div>
    </div>
  );
}
