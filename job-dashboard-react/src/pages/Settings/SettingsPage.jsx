import { useState } from 'react';
import { updateProfile, updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { auth, db } from '../../firebase/config';
import './SettingsPage.css';

export default function SettingsPage() {
  const { user }               = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Profile
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg]     = useState('');

  // Password
  const [currentPwd, setCurrentPwd]   = useState('');
  const [newPwd, setNewPwd]           = useState('');
  const [pwdSaving, setPwdSaving]     = useState(false);
  const [pwdMsg, setPwdMsg]           = useState('');

  async function handleProfileSave(e) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg('');
    try {
      await updateProfile(auth.currentUser, { displayName });
      await setDoc(doc(db, 'users', user.uid), { displayName, updatedAt: serverTimestamp() }, { merge: true });
      setProfileMsg('Profile updated successfully.');
    } catch (err) {
      setProfileMsg(`Error: ${err.message}`);
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (newPwd.length < 6) { setPwdMsg('New password must be at least 6 characters.'); return; }
    setPwdSaving(true);
    setPwdMsg('');
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPwd);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPwd);
      setCurrentPwd('');
      setNewPwd('');
      setPwdMsg('Password changed successfully.');
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPwdMsg('Current password is incorrect.');
      } else {
        setPwdMsg(`Error: ${err.message}`);
      }
    } finally {
      setPwdSaving(false);
    }
  }

  const isGoogle = user?.providerData?.some(p => p.providerId === 'google.com');

  return (
    <div className="settings-page">
      {/* Profile */}
      <div className="card settings-card">
        <h3 className="settings-section-title">
          <span className="material-icons">person</span>
          Profile
        </h3>

        <div className="settings-avatar-row">
          <div className="settings-avatar">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" />
            ) : (
              (user?.displayName?.[0] || user?.email?.[0] || '?').toUpperCase()
            )}
          </div>
          <div>
            <p className="settings-avatar-name">{user?.displayName || 'No name set'}</p>
            <p className="settings-avatar-email">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="settings-form">
          <div className="form-group">
            <label className="form-label">Display Name</label>
            <input
              className="form-control"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your full name"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" value={user?.email || ''} disabled style={{ opacity: .6 }} />
            <span className="form-hint">Email cannot be changed here.</span>
          </div>
          {profileMsg && (
            <p className={`settings-msg ${profileMsg.startsWith('Error') ? 'settings-msg--error' : 'settings-msg--success'}`}>
              {profileMsg}
            </p>
          )}
          <button type="submit" className="btn btn--primary" disabled={profileSaving}>
            {profileSaving ? 'Saving…' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Password — only for email/password users */}
      {!isGoogle && (
        <div className="card settings-card">
          <h3 className="settings-section-title">
            <span className="material-icons">lock</span>
            Change Password
          </h3>
          <form onSubmit={handlePasswordChange} className="settings-form">
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-control"
                value={currentPwd}
                onChange={e => setCurrentPwd(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-control"
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
              />
            </div>
            {pwdMsg && (
              <p className={`settings-msg ${pwdMsg.startsWith('Error') || pwdMsg.includes('incorrect') ? 'settings-msg--error' : 'settings-msg--success'}`}>
                {pwdMsg}
              </p>
            )}
            <button type="submit" className="btn btn--primary" disabled={pwdSaving}>
              {pwdSaving ? 'Saving…' : 'Change Password'}
            </button>
          </form>
        </div>
      )}

      {/* Appearance */}
      <div className="card settings-card">
        <h3 className="settings-section-title">
          <span className="material-icons">palette</span>
          Appearance
        </h3>
        <div className="settings-theme-row">
          <div>
            <p className="settings-theme-label">Dark Mode</p>
            <p className="settings-theme-sub">Reduce eye strain in low-light environments</p>
          </div>
          <button
            className={`theme-toggle ${isDark ? 'theme-toggle--on' : ''}`}
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            role="switch"
            aria-checked={isDark}
          >
            <span className="theme-toggle__knob" />
          </button>
        </div>
      </div>
    </div>
  );
}
