import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { listInterviews, updateInterview, cancelInterview } from '../../services/recruiter';
import './RecruiterPage.css';

const TYPE_LABELS = {
  phone: 'Phone', video: 'Video', onsite: 'On-site',
  technical: 'Technical', panel: 'Panel',
};

function StatusBadge({ status }) {
  return <span className={`badge badge--${status}`}>{status}</span>;
}

function FeedbackModal({ interview, onSave, onClose }) {
  const [feedback, setFeedback] = useState(interview.feedback ?? '');
  const [status, setStatus]     = useState(interview.status);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(interview._id, { feedback, status });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="recruiter-modal-overlay">
      <div className="recruiter-modal">
        <h3>Update Interview</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label>Status</label>
            <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Rescheduled</option>
            </select>
          </div>
          <div className="form-group">
            <label>Interviewer Feedback / Notes</label>
            <textarea
              className="form-control"
              rows={5}
              placeholder="Share feedback, impressions, or next steps…"
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
            />
          </div>
          {error && <div className="inline-error"><span className="material-icons" style={{ fontSize: 15 }}>error_outline</span>{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn btn--secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />Saving…</> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RecruiterInterviewsPage() {
  const { user }   = useAuth();
  const gt         = () => user.getIdToken();

  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [filter, setFilter]         = useState('');
  const [feedbackItem, setFeedbackItem] = useState(null);

  function load() {
    setLoading(true);
    listInterviews(gt, filter ? { status: filter } : {})
      .then(res => setInterviews(res.data ?? []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpdate(id, fields) {
    await updateInterview(gt, id, fields);
    setFeedbackItem(null);
    load();
  }

  async function handleCancel(id) {
    if (!confirm('Cancel this interview?')) return;
    await cancelInterview(gt, id);
    load();
  }

  return (
    <div className="recruiter-page">
      <div className="card">
        <div className="recruiter-section-header" style={{ marginBottom: 16 }}>
          <h2>Interviews</h2>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', fontSize: 14 }}
          >
            <option value="">All</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rescheduled">Rescheduled</option>
          </select>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center' }}><div className="spinner" /></div>
        ) : error ? (
          <div className="inline-error">{error}</div>
        ) : interviews.length === 0 ? (
          <div className="recruiter-empty">
            <span className="material-icons">event_busy</span>
            <p>No interviews{filter ? ` with status "${filter}"` : ''} found.</p>
            <p style={{ fontSize: 13 }}>Schedule interviews from the Applicants tab.</p>
          </div>
        ) : (
          <div className="recruiter-table-wrap">
            <table className="recruiter-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job</th>
                  <th>Date &amp; Time</th>
                  <th>Format</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map(iv => (
                  <tr key={iv._id}>
                    <td>
                      <div className="applicant-info">
                        <div className="applicant-avatar">
                          {iv.applicant?.name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <div className="applicant-name">{iv.applicant?.name ?? '—'}</div>
                          <div className="applicant-email">{iv.applicant?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{iv.job?.title ?? '—'}</td>
                    <td style={{ fontSize: 13 }}>
                      {new Date(iv.scheduledAt).toLocaleString(undefined, {
                        month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{iv.durationMinutes} min</div>
                    </td>
                    <td>{TYPE_LABELS[iv.type] ?? iv.type}</td>
                    <td><StatusBadge status={iv.status} /></td>
                    <td>
                      <div className="table-actions">
                        {iv.meetingLink && (
                          <a href={iv.meetingLink} target="_blank" rel="noopener noreferrer"
                             className="btn btn--secondary btn--sm" title="Join Meeting">
                            <span className="material-icons">videocam</span>
                          </a>
                        )}
                        <button
                          className="btn btn--secondary btn--sm"
                          title="Add Feedback"
                          onClick={() => setFeedbackItem(iv)}
                        >
                          <span className="material-icons">rate_review</span>
                        </button>
                        {iv.status === 'scheduled' && (
                          <button
                            className="btn btn--danger btn--sm"
                            title="Cancel Interview"
                            onClick={() => handleCancel(iv._id)}
                          >
                            <span className="material-icons">cancel</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {feedbackItem && (
        <FeedbackModal
          interview={feedbackItem}
          onSave={handleUpdate}
          onClose={() => setFeedbackItem(null)}
        />
      )}
    </div>
  );
}
