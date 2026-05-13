import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../../services/api';
import './admin.css';

const LIMIT = 20;
const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship'];

const EMPTY_FORM = {
  title: '', company: '', location: '', type: 'full-time', url: '',
  companyLogo: '', salary: '', salaryMin: '', salaryMax: '',
  department: '', description: '', requirements: '', isActive: true,
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminJobsPage() {
  const [jobs,    setJobs]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);

  const [search,       setSearch]       = useState('');
  const [typeFilter,   setTypeFilter]   = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  const [toDelete,   setToDelete]   = useState(null);
  const [deleting,   setDeleting]   = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editJob,   setEditJob]   = useState(null);  // null = create mode
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [formErrs,  setFormErrs]  = useState({});
  const [saving,    setSaving]    = useState(false);

  const searchTimer = useRef(null);

  const load = useCallback((pg, q, type, active) => {
    setLoading(true);
    const params = new URLSearchParams({ page: pg, limit: LIMIT });
    if (q)      params.set('search', q);
    if (type)   params.set('type', type);
    if (active) params.set('active', active);

    api.get(`/admin/jobs?${params}`)
      .then(({ data, pagination }) => {
        setJobs(data);
        setTotal(pagination.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(page, search, typeFilter, activeFilter); }, [load, page, typeFilter, activeFilter]);

  function handleSearchChange(e) {
    const val = e.target.value;
    setSearch(val);
    setPage(1);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(1, val, typeFilter, activeFilter), 350);
  }

  // ── Modal helpers ─────────────────────────────────────────────

  function openCreate() {
    setEditJob(null);
    setForm(EMPTY_FORM);
    setFormErrs({});
    setModalOpen(true);
  }

  function openEdit(job) {
    setEditJob(job);
    setForm({
      title:       job.title       ?? '',
      company:     job.company     ?? '',
      location:    job.location    ?? '',
      type:        job.type        ?? 'full-time',
      url:         job.url         ?? '',
      companyLogo: job.companyLogo ?? '',
      salary:      job.salary      ?? '',
      salaryMin:   job.salaryMin != null ? String(job.salaryMin) : '',
      salaryMax:   job.salaryMax != null ? String(job.salaryMax) : '',
      department:  job.department  ?? '',
      description: job.description ?? '',
      requirements: Array.isArray(job.requirements) ? job.requirements.join('\n') : '',
      isActive:    job.isActive ?? true,
    });
    setFormErrs({});
    setModalOpen(true);
  }

  function setField(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }));
    setFormErrs((prev) => { const n = { ...prev }; delete n[key]; return n; });
  }

  function validate() {
    const errs = {};
    if (!form.title.trim())    errs.title    = 'Required';
    if (!form.company.trim())  errs.company  = 'Required';
    if (!form.location.trim()) errs.location = 'Required';
    if (!form.url.trim())      errs.url      = 'Required';
    else if (!/^https?:\/\/.+/.test(form.url.trim())) errs.url = 'Must start with http:// or https://';
    if (form.salaryMin && isNaN(Number(form.salaryMin))) errs.salaryMin = 'Must be a number';
    if (form.salaryMax && isNaN(Number(form.salaryMax))) errs.salaryMax = 'Must be a number';
    setFormErrs(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);

    const payload = {
      title:       form.title.trim(),
      company:     form.company.trim(),
      location:    form.location.trim(),
      type:        form.type,
      url:         form.url.trim(),
      companyLogo: form.companyLogo.trim() || undefined,
      salary:      form.salary.trim()      || undefined,
      salaryMin:   form.salaryMin !== ''   ? Number(form.salaryMin) : undefined,
      salaryMax:   form.salaryMax !== ''   ? Number(form.salaryMax) : undefined,
      department:  form.department.trim()  || undefined,
      description: form.description.trim() || undefined,
      requirements: form.requirements.trim()
        ? form.requirements.split('\n').map((s) => s.trim()).filter(Boolean)
        : undefined,
      isActive:    form.isActive,
    };

    try {
      if (editJob) {
        const { data } = await api.put(`/jobs/${editJob._id}`, payload);
        setJobs((prev) => prev.map((j) => j._id === editJob._id ? data : j));
      } else {
        const { data } = await api.post('/jobs', payload);
        setJobs((prev) => [data, ...prev]);
        setTotal((t) => t + 1);
      }
      setModalOpen(false);
    } catch (err) {
      if (err.errors?.length) {
        const m = {};
        err.errors.forEach(({ path, msg }) => { m[path] = msg; });
        setFormErrs(m);
      } else {
        setFormErrs({ _global: err.message });
      }
    } finally {
      setSaving(false);
    }
  }

  // ── Toggle active ─────────────────────────────────────────────

  async function handleToggle(job) {
    setTogglingId(job._id);
    try {
      const token = localStorage.getItem('jdToken');
      const res   = await fetch(`/api/admin/jobs/${job._id}/toggle`, {
        method:  'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setJobs((prev) => prev.map((j) => j._id === job._id ? json.data : j));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  }

  // ── Delete ────────────────────────────────────────────────────

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/jobs/${toDelete._id}`);
      setJobs((prev) => prev.map((j) => j._id === toDelete._id ? { ...j, isActive: false } : j));
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
          <h1 className="content__title">Job Management</h1>
          <p className="content__subtitle">{total} job listing{total !== 1 ? 's' : ''} total</p>
        </div>
        <button className="btn btn--primary" onClick={openCreate}>
          <span className="material-icons">add</span> New Job
        </button>
      </div>

      {/* ── Table panel ────────────────────────────────────── */}
      <div className="admin-panel">
        <div className="admin-panel__header">
          <div className="admin-toolbar">
            <div className="admin-toolbar__search">
              <span className="material-icons">search</span>
              <input
                type="text"
                placeholder="Search jobs…"
                value={search}
                onChange={handleSearchChange}
              />
            </div>
            <select
              className="admin-toolbar__select"
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            >
              <option value="">All types</option>
              {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              className="admin-toolbar__select"
              value={activeFilter}
              onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
            >
              <option value="">All status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Type</th>
                <th>Salary</th>
                <th>Status</th>
                <th>Posted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="admin-skeleton-row">
                      <td><div className="shimmer admin-skeleton-cell" style={{ width: '65%' }} /></td>
                      <td><div className="shimmer admin-skeleton-cell" style={{ width: 70 }} /></td>
                      <td><div className="shimmer admin-skeleton-cell" style={{ width: 80 }} /></td>
                      <td><div className="shimmer admin-skeleton-cell" style={{ width: 60 }} /></td>
                      <td><div className="shimmer admin-skeleton-cell" style={{ width: 80 }} /></td>
                      <td><div className="shimmer admin-skeleton-cell" style={{ width: 70 }} /></td>
                    </tr>
                  ))
                : jobs.length === 0
                  ? <tr>
                      <td colSpan={6}>
                        <div className="admin-empty">
                          <span className="material-icons">work_off</span>
                          <span className="admin-empty__text">No jobs found</span>
                        </div>
                      </td>
                    </tr>
                  : jobs.map((job) => (
                      <tr key={job._id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{job.title}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                            {job.company} · {job.location}
                          </div>
                        </td>
                        <td>
                          <span className={`type-badge type-badge--${job.type === 'full-time' ? 'full' : job.type === 'contract' || job.type === 'part-time' ? 'hybrid' : 'remote'}`}>
                            {job.type}
                          </span>
                        </td>
                        <td style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                          {job.salary || (job.salaryMin ? `$${(job.salaryMin/1000).toFixed(0)}k+` : '—')}
                        </td>
                        <td>
                          <span className={`active-badge active-badge--${job.isActive ? 'on' : 'off'}`}>
                            <span className="material-icons" style={{ fontSize: 12 }}>
                              {job.isActive ? 'check_circle' : 'cancel'}
                            </span>
                            {job.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                          {formatDate(job.postedAt)}
                        </td>
                        <td>
                          <div className="admin-actions">
                            <button
                              className="admin-action-btn"
                              title="Edit"
                              onClick={() => openEdit(job)}
                            >
                              <span className="material-icons">edit</span>
                            </button>
                            <button
                              className={`admin-action-btn ${job.isActive ? 'admin-action-btn--danger' : 'admin-action-btn--success'}`}
                              title={job.isActive ? 'Deactivate' : 'Restore'}
                              onClick={() => handleToggle(job)}
                              disabled={togglingId === job._id}
                            >
                              <span className="material-icons">
                                {togglingId === job._id ? 'hourglass_empty' : job.isActive ? 'visibility_off' : 'restore'}
                              </span>
                            </button>
                            <button
                              className="admin-action-btn admin-action-btn--danger"
                              title="Delete"
                              onClick={() => setToDelete(job)}
                            >
                              <span className="material-icons">delete_outline</span>
                            </button>
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
              <button className="admin-pagination__btn" disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}>← Prev</button>
              <button className="admin-pagination__btn" disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Create / Edit modal ─────────────────────────────── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <div className="modal__title">{editJob ? 'Edit Job' : 'New Job Listing'}</div>
              <button className="modal__close" onClick={() => setModalOpen(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="modal__body">
              {formErrs._global && (
                <div className="login-error" style={{ marginBottom: 8 }}>
                  <span className="material-icons">error_outline</span>
                  {formErrs._global}
                </div>
              )}

              <div className="modal__row">
                <Field label="Job Title" req err={formErrs.title}>
                  <input className="form-field__input" value={form.title}
                    onChange={(e) => setField('title', e.target.value)} placeholder="Software Engineer" />
                </Field>
                <Field label="Company" req err={formErrs.company}>
                  <input className="form-field__input" value={form.company}
                    onChange={(e) => setField('company', e.target.value)} placeholder="Acme Corp" />
                </Field>
              </div>

              <div className="modal__row">
                <Field label="Location" req err={formErrs.location}>
                  <input className="form-field__input" value={form.location}
                    onChange={(e) => setField('location', e.target.value)} placeholder="Remote / New York, NY" />
                </Field>
                <Field label="Type" req err={formErrs.type}>
                  <select className="form-field__select" value={form.type}
                    onChange={(e) => setField('type', e.target.value)}>
                    {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Application URL" req err={formErrs.url} full>
                <input className="form-field__input" value={form.url}
                  onChange={(e) => setField('url', e.target.value)}
                  placeholder="https://jobs.example.com/apply/123" />
              </Field>

              <div className="modal__row">
                <Field label="Company Logo URL" err={formErrs.companyLogo}>
                  <input className="form-field__input" value={form.companyLogo}
                    onChange={(e) => setField('companyLogo', e.target.value)}
                    placeholder="https://..." />
                </Field>
                <Field label="Department" err={formErrs.department}>
                  <input className="form-field__input" value={form.department}
                    onChange={(e) => setField('department', e.target.value)}
                    placeholder="Engineering" />
                </Field>
              </div>

              <div className="modal__row">
                <Field label="Salary (display)" err={formErrs.salary}>
                  <input className="form-field__input" value={form.salary}
                    onChange={(e) => setField('salary', e.target.value)}
                    placeholder="$120k – $160k" />
                </Field>
                <div className="modal__row" style={{ gap: 8, margin: 0 }}>
                  <Field label="Min ($)" err={formErrs.salaryMin}>
                    <input className="form-field__input" type="number" min="0" value={form.salaryMin}
                      onChange={(e) => setField('salaryMin', e.target.value)} placeholder="120000" />
                  </Field>
                  <Field label="Max ($)" err={formErrs.salaryMax}>
                    <input className="form-field__input" type="number" min="0" value={form.salaryMax}
                      onChange={(e) => setField('salaryMax', e.target.value)} placeholder="160000" />
                  </Field>
                </div>
              </div>

              <Field label="Description" err={formErrs.description} full>
                <textarea className="form-field__textarea" value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Describe the role…" rows={4} />
              </Field>

              <Field label="Requirements (one per line)" err={formErrs.requirements} full>
                <textarea className="form-field__textarea" value={form.requirements}
                  onChange={(e) => setField('requirements', e.target.value)}
                  placeholder="5+ years React&#10;TypeScript proficiency&#10;Strong communication skills"
                  rows={4} />
              </Field>

              <div>
                <label className="form-toggle" onClick={() => setField('isActive', !form.isActive)}>
                  <div className={`form-toggle__switch ${form.isActive ? 'form-toggle__switch--on' : ''}`} />
                  <span className="form-toggle__label">{form.isActive ? 'Active — visible to job seekers' : 'Inactive — hidden from listings'}</span>
                </label>
              </div>
            </div>

            <div className="modal__footer">
              <button className="btn btn--ghost btn--sm" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn btn--primary btn--sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editJob ? 'Save Changes' : 'Create Job'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ──────────────────────────────────── */}
      {toDelete && (
        <div className="confirm-overlay" onClick={() => setToDelete(null)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-box__icon">
              <span className="material-icons">warning</span>
            </div>
            <div>
              <div className="confirm-box__title">Deactivate job?</div>
              <div className="confirm-box__desc">
                <strong>{toDelete.title}</strong> at <strong>{toDelete.company}</strong> will be hidden from job seekers. You can restore it later.
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
                {deleting ? 'Deactivating…' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Small helper to reduce repetition in the form ─────────────
function Field({ label, req, err, full, children }) {
  return (
    <div className={`form-field${full ? ' form-field--full' : ''}`}>
      <label className={`form-field__label${req ? ' form-field__label--req' : ''}`}>{label}</label>
      {children}
      {err && <span className="form-field__error">{err}</span>}
    </div>
  );
}
