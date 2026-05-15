import { useState, useEffect } from 'react';
import {
  collection, getDocs, doc, setDoc, deleteDoc, query, orderBy, limit,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import './AdminPage.css';

export default function AdminPage() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins]   = useState(new Set());
  const [saving, setSaving]   = useState(null); // uid being toggled

  useEffect(() => {
    async function load() {
      try {
        const [usersSnap, adminsSnap] = await Promise.all([
          getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100))),
          getDocs(collection(db, 'admins')),
        ]);
        setUsers(usersSnap.docs.map(d => ({ uid: d.id, ...d.data() })));
        setAdmins(new Set(adminsSnap.docs.map(d => d.id)));
      } catch (err) {
        console.error('[AdminPage] load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function toggleAdmin(uid, currentlyAdmin) {
    setSaving(uid);
    try {
      if (currentlyAdmin) {
        await deleteDoc(doc(db, 'admins', uid));
        setAdmins(prev => { const s = new Set(prev); s.delete(uid); return s; });
      } else {
        await setDoc(doc(db, 'admins', uid), { grantedAt: new Date() });
        setAdmins(prev => new Set(prev).add(uid));
      }
    } catch (err) {
      alert(`Failed to update admin status: ${err.message}`);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="admin-page">
      <div className="section-header">
        <h2 className="section-title">
          Admin Panel
          <span className="badge badge--purple" style={{ marginLeft: 10, verticalAlign: 'middle' }}>Admin</span>
        </h2>
      </div>

      {/* Stats row */}
      <div className="stats-grid" style={{ marginBottom: 0 }}>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--blue">
            <span className="material-icons">people</span>
          </div>
          <div>
            <div className="stat-card__value">{users.length}</div>
            <div className="stat-card__label">Total Users</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--purple">
            <span className="material-icons">admin_panel_settings</span>
          </div>
          <div>
            <div className="stat-card__value">{admins.size}</div>
            <div className="stat-card__label">Admins</div>
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="admin-table-header">
          <h3 className="section-title" style={{ margin: 0 }}>User Management</h3>
        </div>

        {loading ? (
          <div className="empty-state"><div className="spinner" /></div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <span className="material-icons">people_outline</span>
            <h3>No users found</h3>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Joined</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const isAdmin = admins.has(u.uid);
                  const initials = (u.displayName?.[0] || u.email?.[0] || '?').toUpperCase();
                  const joinDate = u.createdAt?.toDate
                    ? u.createdAt.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                    : '—';
                  return (
                    <tr key={u.uid}>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-avatar">{initials}</div>
                          <span className="admin-user-name">{u.displayName || '—'}</span>
                        </div>
                      </td>
                      <td className="admin-email">{u.email}</td>
                      <td>{joinDate}</td>
                      <td>
                        <span className={`badge ${isAdmin ? 'badge--purple' : 'badge--gray'}`}>
                          {isAdmin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`btn btn--sm ${isAdmin ? 'btn--danger' : 'btn--primary'}`}
                          onClick={() => toggleAdmin(u.uid, isAdmin)}
                          disabled={saving === u.uid}
                        >
                          {saving === u.uid
                            ? 'Saving…'
                            : isAdmin ? 'Revoke Admin' : 'Make Admin'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
