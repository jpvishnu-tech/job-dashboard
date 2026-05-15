import { useState } from 'react';

const TYPE_META = {
  follow_up:          { icon: 'reply',          label: 'Follow Up'         },
  interview:          { icon: 'event',           label: 'Interview'         },
  deadline:           { icon: 'timer',           label: 'Deadline'          },
  recruiter_follow_up:{ icon: 'person_pin',      label: 'Recruiter Follow-Up'},
  task:               { icon: 'assignment',      label: 'Task'              },
  custom:             { icon: 'notifications',   label: 'Custom'            },
};

function fmtDatetime(d) {
  const date = new Date(d);
  return date.toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function countdown(scheduledAt) {
  const diff = new Date(scheduledAt) - Date.now();
  if (diff <= 0) return { label: 'Now', cls: 'rmd-time--overdue' };
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (d >= 1)    return { label: `In ${d}d`,          cls: d <= 2 ? 'rmd-time--soon' : 'rmd-time--ok' };
  if (h >= 1)    return { label: `In ${h}h`,           cls: 'rmd-time--soon' };
  return { label: 'In < 1h', cls: 'rmd-time--soon' };
}

const EMPTY_FORM = {
  type: 'custom', title: '', message: '', scheduledAt: '',
};

function ReminderCard({ reminder, onDismiss, onDelete }) {
  const meta  = TYPE_META[reminder.type] || TYPE_META.custom;
  const cd    = countdown(reminder.scheduledAt);

  return (
    <div className="reminder-card card">
      <div className="reminder-card__header">
        <div className="reminder-card__type">
          <span className="material-icons" style={{ color: '#6366f1' }}>{meta.icon}</span>
          <span>{meta.label}</span>
        </div>
        <span className={`rmd-time ${cd.cls}`}>{cd.label}</span>
      </div>

      <p className="reminder-card__title">{reminder.title}</p>
      {reminder.message && <p className="reminder-card__msg">{reminder.message}</p>}

      <div className="reminder-card__footer">
        <span className="reminder-card__date">
          <span className="material-icons">schedule</span>
          {fmtDatetime(reminder.scheduledAt)}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => onDismiss(reminder._id)}
            title="Dismiss reminder"
          >
            <span className="material-icons">close</span>
          </button>
          <button
            className="btn btn--danger-ghost btn--sm"
            onClick={() => onDelete(reminder._id)}
            title="Delete reminder"
          >
            <span className="material-icons">delete_outline</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RemindersPanel({ reminders, loading, error, onAdd, onDismiss, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const now     = new Date();
  const upcoming = reminders.filter(r => r.status === 'pending' && new Date(r.scheduledAt) >= now);
  const overdue  = reminders.filter(r => r.status === 'pending' && new Date(r.scheduledAt) < now);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim())    { setFormError('Title is required.'); return; }
    if (!form.scheduledAt)     { setFormError('Date & time is required.'); return; }
    if (new Date(form.scheduledAt) <= new Date()) { setFormError('Please choose a future date and time.'); return; }
    setSaving(true);
    try {
      await onAdd(form);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="reminders-panel">
      {/* Toolbar */}
      <div className="reminders-toolbar">
        <div className="reminders-stats">
          {overdue.length > 0 && (
            <span className="rmd-stat rmd-stat--overdue">
              <span className="material-icons">warning</span>
              {overdue.length} overdue
            </span>
          )}
          <span className="rmd-stat">
            <span className="material-icons">notifications</span>
            {upcoming.length} upcoming
          </span>
        </div>
        <button
          className="btn btn--primary btn--sm"
          onClick={() => setShowForm(p => !p)}
        >
          <span className="material-icons">add_alert</span>
          Add Reminder
        </button>
      </div>

      {/* Add reminder form */}
      {showForm && (
        <form className="add-reminder-form card" onSubmit={handleSubmit}>
          <h4 className="form-section-title">
            <span className="material-icons">add_alert</span> New Reminder
          </h4>
          <div className="modal-grid">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-control" value={form.type} onChange={e => set('type', e.target.value)}>
                {Object.entries(TYPE_META).map(([v, m]) => (
                  <option key={v} value={v}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date & Time *</label>
              <input
                type="datetime-local"
                className="form-control"
                value={form.scheduledAt}
                onChange={e => set('scheduledAt', e.target.value)}
                required
              />
            </div>
            <div className="form-group form-group--full">
              <label className="form-label">Title *</label>
              <input
                className="form-control"
                placeholder="What do you want to be reminded about?"
                value={form.title}
                onChange={e => set('title', e.target.value)}
                required
              />
            </div>
            <div className="form-group form-group--full">
              <label className="form-label">Message (optional)</label>
              <input
                className="form-control"
                placeholder="Additional context or notes…"
                value={form.message}
                onChange={e => set('message', e.target.value)}
              />
            </div>
          </div>
          {formError && (
            <div className="modal-error">
              <span className="material-icons">error_outline</span>{formError}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn btn--primary btn--sm" disabled={saving}>
              {saving ? 'Saving…' : 'Set Reminder'}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="card task-error">
          <span className="material-icons">error_outline</span>{error}
        </div>
      )}

      {loading ? (
        <div className="reminders-grid">
          {[1, 2, 3].map(i => <div key={i} className="reminder-card card auto-skeleton" />)}
        </div>
      ) : reminders.length === 0 ? (
        <div className="card auto-empty">
          <span className="material-icons">notifications_none</span>
          <h3>No reminders set</h3>
          <p>Add reminders for follow-ups, interviews, and deadlines to stay on top of your job search.</p>
        </div>
      ) : (
        <>
          {overdue.length > 0 && (
            <section>
              <h4 className="auto-section-title auto-section-title--alert">
                <span className="material-icons">warning</span> Overdue
              </h4>
              <div className="reminders-grid">
                {overdue.map(r => (
                  <ReminderCard key={r._id} reminder={r} onDismiss={onDismiss} onDelete={onDelete} />
                ))}
              </div>
            </section>
          )}
          {upcoming.length > 0 && (
            <section style={{ marginTop: overdue.length > 0 ? 24 : 0 }}>
              {overdue.length > 0 && (
                <h4 className="auto-section-title">
                  <span className="material-icons">upcoming</span> Upcoming
                </h4>
              )}
              <div className="reminders-grid">
                {upcoming.map(r => (
                  <ReminderCard key={r._id} reminder={r} onDismiss={onDismiss} onDelete={onDelete} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
