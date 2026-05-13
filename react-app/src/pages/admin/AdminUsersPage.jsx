import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './admin.css';

const LIMIT = 20;

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function avatarUrl(u) {
  const name = u.name || u.email?.split('@')[0] || 'U';
  return u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=32&bold=true`;
}

export default function AdminUsersPage() {
  const { user: self } = useAuth();

  const [users,   setUsers]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);

  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [toDelete,   setToDelete]   = useState(null);  // user obj
  const [deleting,   setDeleting]   = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const searchTimer = useRef(null);

  const load = useCallback((pg, q, role) => {
    setLoading(true);
    const params = new URLSearchParams({ page: pg, limit: LIMIT });
    if (q)    params.set('search', q);
    if (role) params.set('role', role);

    api.get(`/admin/users?${params}`)
      .then(({ data, pagination }) => {
        setUsers(data);
        setTotal(pagination.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(page, search, roleFilter); }, [load, page, roleFilter]);

  function handleSearchChange(e) {
    const val = e.target.value;
    setSearch(val);
    setPage(1);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(1, val, roleFilter), 350);
  }

  function handleRoleFilterChange(e) {
    setRoleFilter(e.target.value);
    setPage(1);
  }

  async function toggleRole(u) {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    setTogglingId(u._id);
    try {
      const { data } = await api.put
        ? await api.put(`/admin/users/${u._id}`, { role: newRole }) // fallback
        : { data: null };
      // use PATCH via the api object (which only has get/post/put/delete)
      // since PATCH isn't defined we call it as a fetch manually via api.put as close
      // actually api doesn't have patch — let's call fetch directly
      void 0;
    } catch { /* handled below */ }

    // Use raw fetch with PATCH since api.js only exposes get/post/put/delete
    try {
      const token = localStorage.getItem('jdToken');
      const res = await fetch(`/api/admin/users/${u._id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ role: newRole }),
      });
      const json = await res.json();
      if (json.success) {
        setUsers((prev) => prev.map((x) => x._id === u._id ? { ...x, role: newRole } : x));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${toDelete._id}`);
      setUsers((prev) => prev.filter((u) => u._id !== toDelete._id));
      setTotal((t) => t - 1);
      setToDelete(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="content__header">
        <div>
          <h1 className="content__title">User Management</h1>
          <p className="content__subtitle">{total} registered user{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* ── Table panel ────────────────────────────────────── */}
      <div className="admin-panel">
        <div className="admin-panel__header">
          <div className="admin-toolbar">
            <div className="admin-toolbar__search">
              <span className="material-icons">search</span>
              <input
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={handleSearchChange}
              />
            </div>
            <select
              className="admin-toolbar__select"
              value={roleFilter}
              onChange={handleRoleFilterChange}
            >
              <option value="">All roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="admin-skeleton-row">
                      <td><div className="shimmer admin-skeleton-cell" style={{ width: '60%' }} /></td>
                      <td><div className="shimmer admin-skeleton-cell" style={{ width: 60 }} /></td>
                      <td><div className="shimmer admin-skeleton-cell" style={{ width: 80 }} /></td>
                      <td><div className="shimmer admin-skeleton-cell" style={{ width: 70 }} /></td>
                    </tr>
                  ))
                : users.length === 0
                  ? <tr>
                      <td colSpan={4}>
                        <div className="admin-empty">
                          <span className="material-icons">person_off</span>
                          <span className="admin-empty__text">No users found</span>
                        </div>
                      </td>
                    </tr>
                  : users.map((u) => (
                      <tr key={u._id}>
                        <td>
                          <div className="user-cell">
                            <img src={avatarUrl(u)} alt={u.name} className="user-cell__avatar" />
                            <div>
                              <div className="user-cell__name">
                                {u.name || '—'}
                                {u._id === self?._id && (
                                  <span style={{ marginLeft: 6, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>(you)</span>
                                )}
                              </div>
                              <div className="user-cell__email">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`role-badge role-badge--${u.role}`}>
                            <span className="material-icons">{u.role === 'admin' ? 'shield' : 'person'}</span>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                          {formatDate(u.createdAt)}
                        </td>
                        <td>
                          <div className="admin-actions">
                            {u._id !== self?._id && (
                              <>
                                <button
                                  className="admin-action-btn"
                                  title={u.role === 'admin' ? 'Revoke admin' : 'Make admin'}
                                  onClick={() => toggleRole(u)}
                                  disabled={togglingId === u._id}
                                >
                                  <span className="material-icons">
                                    {togglingId === u._id ? 'hourglass_empty' : u.role === 'admin' ? 'person_remove' : 'manage_accounts'}
                                  </span>
                                </button>
                                <button
                                  className="admin-action-btn admin-action-btn--danger"
                                  title="Delete user"
                                  onClick={() => setToDelete(u)}
                                >
                                  <span className="material-icons">delete_outline</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
              }
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="admin-pagination">
            <span className="admin-pagination__info">
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
            </span>
            <div className="admin-pagination__btns">
              <button
                className="admin-pagination__btn"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >← Prev</button>
              <button
                className="admin-pagination__btn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete confirm dialog ───────────────────────────── */}
      {toDelete && (
        <div className="confirm-overlay" onClick={() => setToDelete(null)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-box__icon">
              <span className="material-icons">warning</span>
            </div>
            <div>
              <div className="confirm-box__title">Delete user?</div>
              <div className="confirm-box__desc">
                <strong>{toDelete.name || toDelete.email}</strong> and all their applications will be permanently deleted. This cannot be undone.
              </div>
            </div>
            <div className="confirm-box__actions">
              <button className="btn btn--ghost btn--sm" onClick={() => setToDelete(null)}>Cancel</button>
              <button
                className="btn btn--sm"
                style={{ background: 'var(--color-red)', color: '#fff' }}
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
