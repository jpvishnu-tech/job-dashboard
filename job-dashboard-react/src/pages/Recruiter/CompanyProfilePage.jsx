import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCompany, createCompany, updateCompany } from '../../services/recruiter';
import './RecruiterPage.css';

const SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

const EMPTY = {
  name: '', logo: '', website: '', industry: '',
  size: '', description: '', location: '',
};

export default function CompanyProfilePage() {
  const { user } = useAuth();
  const gt       = () => user.getIdToken();

  const [company, setCompany]   = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  useEffect(() => {
    getCompany(gt)
      .then(res => {
        if (res.data) {
          setCompany(res.data);
          setForm({
            name:        res.data.name        ?? '',
            logo:        res.data.logo        ?? '',
            website:     res.data.website     ?? '',
            industry:    res.data.industry    ?? '',
            size:        res.data.size        ?? '',
            description: res.data.description ?? '',
            location:    res.data.location    ?? '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      let res;
      if (company) {
        res = await updateCompany(gt, form);
      } else {
        res = await createCompany(gt, form);
      }
      setCompany(res.data);
      setSuccess('Company profile saved successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="recruiter-page"><div className="card"><div className="spinner" /></div></div>;

  return (
    <div className="recruiter-page">
      <div className="card" style={{ maxWidth: 680 }}>
        <div className="recruiter-section-header" style={{ marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0 }}>{company ? 'Company Profile' : 'Create Company Profile'}</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              {company
                ? 'Update your company information shown to applicants.'
                : 'Set up your company profile to start posting jobs.'}
            </p>
          </div>
          {company?.isVerified && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#16a34a', fontSize: 13, fontWeight: 600 }}>
              <span className="material-icons" style={{ fontSize: 18 }}>verified</span>
              Verified
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-row">
            <div className="form-group">
              <label>Company Name *</label>
              <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Industry</label>
              <input className="form-control" placeholder="e.g. Software, Finance…" value={form.industry} onChange={e => set('industry', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Company Size</label>
              <select className="form-control" value={form.size} onChange={e => set('size', e.target.value)}>
                <option value="">Select size…</option>
                {SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Location / HQ</label>
              <input className="form-control" placeholder="e.g. San Francisco, CA" value={form.location} onChange={e => set('location', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Website URL</label>
              <input className="form-control" type="url" placeholder="https://…" value={form.website} onChange={e => set('website', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Logo URL</label>
              <input className="form-control" type="url" placeholder="https://…/logo.png" value={form.logo} onChange={e => set('logo', e.target.value)} />
            </div>
          </div>

          {form.logo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src={form.logo} alt="Logo preview" style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--border)' }} />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Logo preview</span>
            </div>
          )}

          <div className="form-group">
            <label>Company Description</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Describe your company, culture, and what makes you unique…"
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          {error   && <div className="inline-error"><span className="material-icons" style={{ fontSize: 15 }}>error_outline</span>{error}</div>}
          {success && <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, color: '#16a34a', fontSize: 14, display: 'flex', gap: 8 }}><span className="material-icons" style={{ fontSize: 18 }}>check_circle</span>{success}</div>}

          <div>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving
                ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />Saving…</>
                : <><span className="material-icons">save</span>{company ? 'Save Changes' : 'Create Profile'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
