import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { addInterview, updateInterview } from '../../../services/applications';

const INTERVIEW_TYPES = ['phone', 'video', 'onsite', 'technical', 'hr', 'panel', 'final'];
const TYPE_META = {
  phone:     { icon: 'phone',         label: 'Phone Screen'    },
  video:     { icon: 'videocam',      label: 'Video Call'      },
  onsite:    { icon: 'business',      label: 'On-site'         },
  technical: { icon: 'code',          label: 'Technical'       },
  hr:        { icon: 'person',        label: 'HR Interview'    },
  panel:     { icon: 'groups',        label: 'Panel Interview' },
  final:     { icon: 'flag',          label: 'Final Round'     },
};

const STATUS_META = {
  scheduled:   { label: 'Scheduled',   color: '#f59e0b', bg: '#fef3c7' },
  completed:   { label: 'Completed',   color: '#10b981', bg: '#d1fae5' },
  cancelled:   { label: 'Cancelled',   color: '#ef4444', bg: '#fee2e2' },
  rescheduled: { label: 'Rescheduled', color: '#8b5cf6', bg: '#ede9fe' },
};

const OUTCOME_META = {
  positive: { label: 'Positive', color: '#10b981' },
  negative: { label: 'Negative', color: '#ef4444' },
  neutral:  { label: 'Neutral',  color: '#f59e0b' },
};

const EMPTY_INTERVIEW = {
  type: 'video', scheduledAt: '', duration: 60,
  location: '', meetingLink: '', interviewer: '', notes: '',
};

function InterviewForm({ appId, onClose, onSaved }) {
  const { user }      = useAuth();
  const [form, setForm] = useState(EMPTY_INTERVIEW);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    if (!form.scheduledAt) { setError('Please select a date and time.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await addInterview(() => user.getIdToken(), appId, form);
      onSaved(res.data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h3 className="modal-title">Schedule Interview</h3>
          <button type="button" className="modal-close" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>
        <form onSubmit={submit} className="modal-body">
          <div className="modal-grid">
            <div className="form-group">
              <label className="form-label">Interview Type</label>
              <select className="form-control" value={form.type} onChange={e => set('type', e.target.value)}>
                {INTERVIEW_TYPES.map(t => (
                  <option key={t} value={t}>{TYPE_META[t].label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date & Time *</label>
              <input type="datetime-local" className="form-control"
                value={form.scheduledAt} onChange={e => set('scheduledAt', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Duration (minutes)</label>
              <input type="number" className="form-control" min="15" max="480" step="15"
                value={form.duration} onChange={e => set('duration', +e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Interviewer</label>
              <input className="form-control" placeholder="Name / team"
                value={form.interviewer} onChange={e => set('interviewer', e.target.value)} />
            </div>
            <div className="form-group form-group--full">
              <label className="form-label">Meeting Link</label>
              <input type="url" className="form-control" placeholder="https://meet.google.com/..."
                value={form.meetingLink} onChange={e => set('meetingLink', e.target.value)} />
            </div>
            <div className="form-group form-group--full">
              <label className="form-label">Location / Notes</label>
              <input className="form-control" placeholder="Office address or prep notes"
                value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>
          {error && (
            <div className="modal-error">
              <span className="material-icons">error_outline</span>{error}
            </div>
          )}
          <div className="modal-footer">
            <button type="button" className="btn btn--secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Scheduling…' : 'Schedule Interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InterviewCard({ interview, appName, appId, onUpdate }) {
  const { user }          = useAuth();
  const [editing, setEditing] = useState(false);
  const [feedback, setFeedback] = useState(interview.feedback || '');
  const [saving, setSaving]     = useState(false);
  const meta   = STATUS_META[interview.status]   || STATUS_META.scheduled;
  const tyMeta = TYPE_META[interview.type]        || TYPE_META.video;

  const scheduled = new Date(interview.scheduledAt);
  const isPast    = scheduled < new Date();
  const countdown = isPast ? null : Math.ceil((scheduled - Date.now()) / 86400000);

  async function markComplete() {
    setSaving(true);
    try {
      const res = await updateInterview(
        () => user.getIdToken(), appId, interview._id,
        { status: 'completed', feedback },
      );
      onUpdate(res.data);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  return (
    <div className="interview-card card">
      <div className="interview-card__header">
        <div className="interview-card__type">
          <span className="material-icons" style={{ color: '#6366f1' }}>{tyMeta.icon}</span>
          <span className="interview-card__type-label">{tyMeta.label}</span>
        </div>
        <span
          className="interview-card__status"
          style={{ background: meta.bg, color: meta.color }}
        >
          {meta.label}
        </span>
      </div>

      <div className="interview-card__company">{appName}</div>

      <div className="interview-card__datetime">
        <span className="material-icons">event</span>
        {scheduled.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
        {' at '}
        {scheduled.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
        {' · '}
        {interview.duration} min
      </div>

      {interview.interviewer && (
        <div className="interview-card__detail">
          <span className="material-icons">person</span>{interview.interviewer}
        </div>
      )}

      {interview.meetingLink && (
        <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer"
          className="btn btn--secondary btn--sm interview-card__link">
          <span className="material-icons">videocam</span> Join Meeting
        </a>
      )}

      {!isPast && countdown !== null && (
        <div className="interview-card__countdown">
          <span className="material-icons">schedule</span>
          {countdown === 0 ? 'Today' : `In ${countdown} day${countdown === 1 ? '' : 's'}`}
        </div>
      )}

      {interview.status === 'scheduled' && isPast && !editing && (
        <button className="btn btn--primary btn--sm" onClick={() => setEditing(true)}>
          <span className="material-icons">check_circle</span> Mark Complete
        </button>
      )}

      {editing && (
        <div className="interview-card__feedback">
          <textarea className="form-control" rows={2}
            placeholder="Add feedback or outcome notes…"
            value={feedback} onChange={e => setFeedback(e.target.value)} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn btn--primary btn--sm" disabled={saving} onClick={markComplete}>
              {saving ? 'Saving…' : 'Confirm'}
            </button>
            <button className="btn btn--secondary btn--sm" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {interview.feedback && !editing && (
        <div className="interview-card__note">
          <span className="material-icons">notes</span>
          <p>{interview.feedback}</p>
        </div>
      )}
    </div>
  );
}

export default function InterviewView({ applications, onApplicationUpdate }) {
  const [scheduleFor, setScheduleFor] = useState(null); // appId
  const [appFilter, setAppFilter]     = useState('');

  // Collect all interviews from all applications
  const allInterviews = [];
  for (const app of applications) {
    for (const iv of app.interviews || []) {
      allInterviews.push({ interview: iv, app });
    }
  }

  // Sort: upcoming first, then by date desc
  allInterviews.sort((a, b) => {
    const da = new Date(a.interview.scheduledAt).getTime();
    const db = new Date(b.interview.scheduledAt).getTime();
    const now = Date.now();
    const futureA = da >= now, futureB = db >= now;
    if (futureA && !futureB) return -1;
    if (!futureA && futureB) return 1;
    return futureA ? da - db : db - da;
  });

  const upcoming = allInterviews.filter(x => new Date(x.interview.scheduledAt) >= new Date());
  const past     = allInterviews.filter(x => new Date(x.interview.scheduledAt) < new Date());

  return (
    <div className="interview-view">
      {/* Header */}
      <div className="interview-view__header">
        <div className="interview-view__stats">
          <span className="interview-stat">
            <span className="material-icons">upcoming</span>
            <strong>{upcoming.length}</strong> upcoming
          </span>
          <span className="interview-stat">
            <span className="material-icons">history</span>
            <strong>{past.length}</strong> past
          </span>
        </div>
        <div className="interview-view__controls">
          <select
            className="form-control"
            style={{ width: 220 }}
            value={scheduleFor || ''}
            onChange={e => setScheduleFor(e.target.value || null)}
          >
            <option value="">Schedule interview for…</option>
            {applications.map(a => (
              <option key={a._id} value={a._id}>{a.company} – {a.role}</option>
            ))}
          </select>
        </div>
      </div>

      {scheduleFor && (
        <InterviewForm
          appId={scheduleFor}
          onClose={() => setScheduleFor(null)}
          onSaved={onApplicationUpdate}
        />
      )}

      {allInterviews.length === 0 ? (
        <div className="card interview-empty">
          <span className="material-icons">event_note</span>
          <h3>No interviews scheduled</h3>
          <p>Use the dropdown above to schedule your first interview.</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section>
              <h4 className="interview-section-title">
                <span className="material-icons">upcoming</span> Upcoming
              </h4>
              <div className="interview-grid">
                {upcoming.map(({ interview, app }) => (
                  <InterviewCard
                    key={interview._id}
                    interview={interview}
                    appId={app._id}
                    appName={`${app.company} – ${app.role}`}
                    onUpdate={onApplicationUpdate}
                  />
                ))}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section style={{ marginTop: 24 }}>
              <h4 className="interview-section-title" style={{ color: 'var(--text-secondary)' }}>
                <span className="material-icons">history</span> Past
              </h4>
              <div className="interview-grid">
                {past.map(({ interview, app }) => (
                  <InterviewCard
                    key={interview._id}
                    interview={interview}
                    appId={app._id}
                    appName={`${app.company} – ${app.role}`}
                    onUpdate={onApplicationUpdate}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
