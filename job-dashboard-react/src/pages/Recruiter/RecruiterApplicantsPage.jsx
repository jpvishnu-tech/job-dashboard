import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  listApplicants, updateApplicantStatus,
  scheduleInterview, listJobs,
} from '../../services/recruiter';
import './RecruiterPage.css';

const STATUS_COLORS = {
  pending: '--amber', shortlisted: '--blue', interview: '--purple',
  offer: '--green', hired: '--green', rejected: '--red',
};

function AtsBadge({ score }) {
  if (score == null) return <span className="ats-chip ats-chip--none">N/A</span>;
  const cls = score >= 70 ? 'ats-chip--high' : score >= 50 ? 'ats-chip--medium' : 'ats-chip--low';
  return <span className={`ats-chip ${cls}`}>{score}</span>;
}

function ScheduleModal({ appId, jobId, onSave, onClose }) {
  const [form, setForm] = useState({
    scheduledAt: '', durationMinutes: 60, type: 'video', meetingLink: '', location: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({ applicationId: appId, ...form });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="recruiter-modal-overlay">
      <div className="recruiter-modal">
        <h3>Schedule Interview</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-row">
            <div className="form-group">
              <label>Date &amp; Time *</label>
              <input className="form-control" type="datetime-local" value={form.scheduledAt}
                onChange={e => set('scheduledAt', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Duration (min)</label>
              <input className="form-control" type="number" min="15" max="480" value={form.durationMinutes}
                onChange={e => set('durationMinutes', Number(e.target.value))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Format</label>
              <select className="form-control" value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="video">Video call</option>
                <option value="phone">Phone call</option>
                <option value="onsite">On-site</option>
                <option value="technical">Technical round</option>
                <option value="panel">Panel interview</option>
              </select>
            </div>
            <div className="form-group">
              <label>Meeting Link</label>
              <input className="form-control" type="url" placeholder="https://meet.google.com/…"
                value={form.meetingLink} onChange={e => set('meetingLink', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Notes for interviewer</label>
            <textarea className="form-control" rows={2} value={form.notes}
              onChange={e => set('notes', e.target.value)} />
          </div>
          {error && <div className="inline-error"><span className="material-icons" style={{ fontSize: 15 }}>error_outline</span>{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn btn--secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />Scheduling…</> : 'Schedule & Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RecruiterApplicantsPage() {
  const { jobId }  = useParams();
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const gt         = () => user.getIdToken();

  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [statusFilter, setFilter]   = useState('');
  const [scheduleApp, setScheduleApp] = useState(null);
  const [selectedJob, setSelectedJob] = useState(jobId ?? '');
  const [jobs, setJobs]             = useState([]);

  // Load the recruiter's jobs for the job-selector
  useEffect(() => {
    listJobs(gt, { active: 'true' }).then(res => setJobs(res.data ?? [])).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function load() {
    if (!selectedJob) { setApplicants([]); setLoading(false); return; }
    setLoading(true);
    listApplicants(gt, selectedJob, statusFilter ? { status: statusFilter } : {})
      .then(res => setApplicants(res.data ?? []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [selectedJob, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleStatus(appId, status) {
    try {
      await updateApplicantStatus(gt, appId, status);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleSchedule(payload) {
    await scheduleInterview(gt, payload);
    setScheduleApp(null);
    load();
  }

  return (
    <div className="recruiter-page">
      <div className="card">
        <div className="recruiter-section-header" style={{ marginBottom: 16 }}>
          <h2>Applicant Tracker</h2>
          <div className="recruiter-filters">
            <select
              value={selectedJob}
              onChange={e => setSelectedJob(e.target.value)}
            >
              <option value="">— Select a job —</option>
              {jobs.map(j => <option key={j._id} value={j._id}>{j.title}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setFilter(e.target.value)}>
              <option value="">All statuses</option>
              {['pending','shortlisted','interview','offer','hired','rejected'].map(s => (
                <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {!selectedJob ? (
          <div className="recruiter-empty">
            <span className="material-icons">people_outline</span>
            <p>Select a job above to view its applicants.</p>
          </div>
        ) : loading ? (
          <div style={{ padding: 32, textAlign: 'center' }}><div className="spinner" /></div>
        ) : error ? (
          <div className="inline-error">{error}</div>
        ) : applicants.length === 0 ? (
          <div className="recruiter-empty">
            <span className="material-icons">inbox</span>
            <p>No applicants{statusFilter ? ` with status "${statusFilter}"` : ''} yet.</p>
          </div>
        ) : (
          <div className="recruiter-table-wrap">
            <table className="recruiter-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Applied</th>
                  <th>ATS Score</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map(app => (
                  <tr key={app._id}>
                    <td>
                      <div className="applicant-info">
                        <div className="applicant-avatar">
                          {app.user?.name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <div className="applicant-name">{app.user?.name ?? '—'}</div>
                          <div className="applicant-email">{app.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {new Date(app.appliedAt).toLocaleDateString()}
                    </td>
                    <td><AtsBadge score={app.atsScore} /></td>
                    <td>
                      <select
                        className="form-control"
                        style={{ padding: '4px 8px', fontSize: 13, width: 'auto' }}
                        value={app.status}
                        onChange={e => handleStatus(app._id, e.target.value)}
                      >
                        {['pending','shortlisted','interview','offer','hired','rejected'].map(s => (
                          <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="table-actions">
                        {/* Schedule interview */}
                        <button
                          className="btn btn--secondary btn--sm"
                          title="Schedule Interview"
                          onClick={() => setScheduleApp(app)}
                        >
                          <span className="material-icons">event</span>
                        </button>
                        {/* Shortlist */}
                        <button
                          className="btn btn--secondary btn--sm"
                          title="Shortlist"
                          onClick={() => handleStatus(app._id, 'shortlisted')}
                          disabled={app.status === 'shortlisted'}
                        >
                          <span className="material-icons">star</span>
                        </button>
                        {/* Reject */}
                        <button
                          className="btn btn--danger btn--sm"
                          title="Reject"
                          onClick={() => handleStatus(app._id, 'rejected')}
                          disabled={app.status === 'rejected'}
                        >
                          <span className="material-icons">close</span>
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

      {scheduleApp && (
        <ScheduleModal
          appId={scheduleApp._id}
          jobId={selectedJob}
          onSave={handleSchedule}
          onClose={() => setScheduleApp(null)}
        />
      )}
    </div>
  );
}
