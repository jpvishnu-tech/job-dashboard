import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  listJobs, createJob, updateJob,
  setJobStatus, deleteJob,
} from '../../services/recruiter';
import './RecruiterPage.css';

const INITIAL_FORM = {
  title: '', company: '', location: '', type: 'full-time',
  department: '', salary: '', salaryMin: '', salaryMax: '',
  description: '', url: '', requirements: '',
};

function JobModal({ job, onSave, onClose }) {
  const [form, setForm]   = useState(job ? { ...job, requirements: (job.requirements ?? []).join('\n') } : INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  function set(field, val) { setForm(f => ({ ...f, [field]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        salaryMin:    Number(form.salaryMin) || 0,
        salaryMax:    Number(form.salaryMax) || 0,
        requirements: form.requirements.split('\n').map(s => s.trim()).filter(Boolean),
      };
      await onSave(payload);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="recruiter-modal-overlay">
      <div className="recruiter-modal">
        <h3>{job ? 'Edit Job' : 'Post New Job'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-row">
            <div className="form-group">
              <label>Job Title *</label>
              <input className="form-control" value={form.title} onChange={e => set('title', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Company Name *</label>
              <input className="form-control" value={form.company} onChange={e => set('company', e.target.value)} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Location *</label>
              <input className="form-control" value={form.location} onChange={e => set('location', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Type *</label>
              <select className="form-control" value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Department</label>
              <input className="form-control" value={form.department} onChange={e => set('department', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Salary (display)</label>
              <input className="form-control" placeholder="e.g. $80k–$100k" value={form.salary} onChange={e => set('salary', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Min Salary ($)</label>
              <input className="form-control" type="number" min="0" value={form.salaryMin} onChange={e => set('salaryMin', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Max Salary ($)</label>
              <input className="form-control" type="number" min="0" value={form.salaryMax} onChange={e => set('salaryMax', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Application URL *</label>
            <input className="form-control" type="url" value={form.url} onChange={e => set('url', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" rows={4} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Requirements (one per line)</label>
            <textarea className="form-control" rows={3} value={form.requirements} onChange={e => set('requirements', e.target.value)} />
          </div>
          {error && <div className="inline-error"><span className="material-icons" style={{ fontSize: 15 }}>error_outline</span>{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn btn--secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />Saving…</> : job ? 'Save Changes' : 'Post Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RecruiterJobsPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const gt        = () => user.getIdToken();

  const [jobs, setJobs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editJob, setEditJob]   = useState(null);
  const [filter, setFilter]     = useState('all');

  function load() {
    setLoading(true);
    listJobs(gt, filter !== 'all' ? { active: filter === 'active' } : {})
      .then(res => setJobs(res.data ?? []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave(payload) {
    if (editJob) {
      await updateJob(gt, editJob._id, payload);
    } else {
      await createJob(gt, payload);
    }
    setShowModal(false);
    setEditJob(null);
    load();
  }

  async function handleToggle(job) {
    await setJobStatus(gt, job._id, !job.isActive);
    load();
  }

  async function handleDelete(job) {
    if (!confirm(`Close and remove "${job.title}"?`)) return;
    await deleteJob(gt, job._id);
    load();
  }

  return (
    <div className="recruiter-page">
      <div className="card">
        <div className="recruiter-section-header" style={{ marginBottom: 16 }}>
          <h2>Job Postings</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <select
              className="recruiter-filters"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', fontSize: 14 }}
            >
              <option value="all">All Jobs</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
            <button className="btn btn--primary" onClick={() => { setEditJob(null); setShowModal(true); }}>
              <span className="material-icons">add</span> Post Job
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center' }}><div className="spinner" /></div>
        ) : error ? (
          <div className="inline-error">{error}</div>
        ) : jobs.length === 0 ? (
          <div className="recruiter-empty">
            <span className="material-icons">work_off</span>
            <p>No jobs posted yet.</p>
            <button className="btn btn--primary" onClick={() => setShowModal(true)}>Post Your First Job</button>
          </div>
        ) : (
          <div className="recruiter-table-wrap">
            <table className="recruiter-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Applicants</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job._id}>
                    <td style={{ fontWeight: 600 }}>{job.title}</td>
                    <td>{job.location}</td>
                    <td style={{ textTransform: 'capitalize' }}>{job.type}</td>
                    <td>{job.applicationCount ?? 0}</td>
                    <td>
                      <span className={`badge badge--${job.isActive ? 'active' : 'closed'}`}>
                        {job.isActive ? 'Active' : 'Closed'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn btn--secondary btn--sm"
                          onClick={() => navigate(`/recruiter/applicants/${job._id}`)}
                          title="View Applicants"
                        >
                          <span className="material-icons">people</span>
                        </button>
                        <button
                          className="btn btn--secondary btn--sm"
                          onClick={() => { setEditJob(job); setShowModal(true); }}
                          title="Edit"
                        >
                          <span className="material-icons">edit</span>
                        </button>
                        <button
                          className="btn btn--secondary btn--sm"
                          onClick={() => handleToggle(job)}
                          title={job.isActive ? 'Close Job' : 'Reopen Job'}
                        >
                          <span className="material-icons">{job.isActive ? 'pause_circle' : 'play_circle'}</span>
                        </button>
                        <button
                          className="btn btn--danger btn--sm"
                          onClick={() => handleDelete(job)}
                          title="Delete"
                        >
                          <span className="material-icons">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <JobModal
          job={editJob}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditJob(null); }}
        />
      )}
    </div>
  );
}
