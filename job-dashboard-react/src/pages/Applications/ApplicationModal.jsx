import { useState, useEffect } from 'react';

const STAGES = [
  { value: 'saved',                label: 'Saved'               },
  { value: 'applied',              label: 'Applied'             },
  { value: 'under_review',         label: 'Under Review'        },
  { value: 'interview_scheduled',  label: 'Interview Scheduled' },
  { value: 'interview_completed',  label: 'Interview Completed' },
  { value: 'offer_received',       label: 'Offer Received'      },
  { value: 'hired',                label: 'Hired'               },
  { value: 'rejected',             label: 'Rejected'            },
];

const JOB_TYPES  = ['full-time', 'part-time', 'contract', 'internship', 'remote'];
const PRIORITIES = ['low', 'medium', 'high'];

const EMPTY = {
  company: '', role: '', location: '', salary: '', type: 'full-time',
  url: '', contactName: '', contactEmail: '',
  status: 'saved', priority: 'medium', notes: '', tags: '',
};

export default function ApplicationModal({ open, onClose, onSave, initial = null }) {
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (open) {
      setForm(initial
        ? { ...EMPTY, ...initial, tags: (initial.tags || []).join(', ') }
        : EMPTY
      );
      setError('');
    }
  }, [open, initial]);

  if (!open) return null;

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.company.trim() || !form.role.trim()) {
      setError('Company and role are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
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
          <h3 className="modal-title">{initial ? 'Edit Application' : 'Add Application'}</h3>
          <button className="modal-close" onClick={onClose} type="button">
            <span className="material-icons">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="modal-grid">
            <div className="form-group">
              <label className="form-label">Company *</label>
              <input className="form-control" placeholder="e.g. Acme Corp"
                value={form.company} onChange={e => set('company', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Role *</label>
              <input className="form-control" placeholder="e.g. Senior Engineer"
                value={form.role} onChange={e => set('role', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-control" placeholder="e.g. New York, NY"
                value={form.location} onChange={e => set('location', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Salary</label>
              <input className="form-control" placeholder="e.g. $120k–$150k"
                value={form.salary} onChange={e => set('salary', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-control" value={form.type} onChange={e => set('type', e.target.value)}>
                {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
                {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-control" value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Job URL</label>
              <input type="url" className="form-control" placeholder="https://..."
                value={form.url} onChange={e => set('url', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Name</label>
              <input className="form-control" placeholder="Recruiter / hiring manager"
                value={form.contactName} onChange={e => set('contactName', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input type="email" className="form-control" placeholder="recruiter@company.com"
                value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} />
            </div>
            <div className="form-group form-group--full">
              <label className="form-label">Tags <span style={{ color: 'var(--text-muted)' }}>(comma-separated)</span></label>
              <input className="form-control" placeholder="e.g. startup, react, remote"
                value={form.tags} onChange={e => set('tags', e.target.value)} />
            </div>
            <div className="form-group form-group--full">
              <label className="form-label">Notes</label>
              <textarea className="form-control" rows={3}
                placeholder="Any notes about this application..."
                value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>

          {error && (
            <div className="modal-error">
              <span className="material-icons">error_outline</span>
              {error}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn--secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
