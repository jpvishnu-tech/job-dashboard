import { useState, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { generateCoverLetter } from '../../../services/automation';

const TONES = [
  { value: 'professional',  label: 'Professional',  desc: 'Formal and polished — ideal for corporate roles'       },
  { value: 'enthusiastic',  label: 'Enthusiastic',  desc: 'Warm and energetic — great for startups and creative'   },
  { value: 'concise',       label: 'Concise',        desc: 'Brief and direct — tailored for busy hiring managers'   },
];

const EMPTY_FORM = {
  company: '', role: '', description: '', tone: 'professional', candidateName: '',
};

export default function CoverLetterPanel() {
  const { user }       = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [result, setResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError]   = useState('');
  const [copied, setCopied] = useState(false);
  const outputRef = useRef(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!form.company.trim()) { setError('Company name is required.'); return; }
    if (!form.role.trim())    { setError('Role/position is required.'); return; }

    setGenerating(true);
    try {
      const res = await generateCoverLetter(() => user.getIdToken(), form);
      setResult(res.data);
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    if (!result?.coverLetter) return;
    try {
      await navigator.clipboard.writeText(result.coverLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  function handleDownload() {
    if (!result?.coverLetter) return;
    const blob = new Blob([result.coverLetter], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `cover-letter-${form.company.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="cover-panel">
      {/* Generator form */}
      <div className="cover-form card">
        <div className="cover-form__header">
          <span className="material-icons cover-form__icon">edit_note</span>
          <div>
            <h3 className="cover-form__title">AI Cover Letter Generator</h3>
            <p className="cover-form__sub">Personalised to your resume profile and the specific role</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-grid">
            <div className="form-group">
              <label className="form-label">Company *</label>
              <input
                className="form-control"
                placeholder="e.g. Google, Stripe, Vercel…"
                value={form.company}
                onChange={e => set('company', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Role / Position *</label>
              <input
                className="form-control"
                placeholder="e.g. Senior Frontend Engineer"
                value={form.role}
                onChange={e => set('role', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Your Name (for sign-off)</label>
              <input
                className="form-control"
                placeholder="Your full name"
                value={form.candidateName}
                onChange={e => set('candidateName', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tone</label>
              <select
                className="form-control"
                value={form.tone}
                onChange={e => set('tone', e.target.value)}
              >
                {TONES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <span className="form-hint">
                {TONES.find(t => t.value === form.tone)?.desc}
              </span>
            </div>
            <div className="form-group form-group--full">
              <label className="form-label">Job Description (optional but recommended)</label>
              <textarea
                className="form-control cover-jd-textarea"
                rows={6}
                placeholder="Paste the job description here to generate a highly tailored letter. The more context you provide, the better the result."
                value={form.description}
                onChange={e => set('description', e.target.value)}
              />
              <span className="form-hint">{form.description.length}/2000 chars</span>
            </div>
          </div>

          {error && (
            <div className="modal-error">
              <span className="material-icons">error_outline</span>{error}
            </div>
          )}

          <div className="cover-form__footer">
            <button type="submit" className="btn btn--primary" disabled={generating}>
              <span className="material-icons">{generating ? 'hourglass_top' : 'auto_awesome'}</span>
              {generating ? 'Generating…' : 'Generate Cover Letter'}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => { setForm(EMPTY_FORM); setResult(null); setError(''); }}
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Generated result */}
      {result && (
        <div className="cover-output card" ref={outputRef}>
          {/* Subject line */}
          <div className="cover-output__subject">
            <span className="material-icons">mail_outline</span>
            <span className="cover-output__subject-label">Email Subject:</span>
            <span className="cover-output__subject-text">{result.subject}</span>
          </div>

          {/* Key highlights */}
          {result.keyHighlights?.length > 0 && (
            <div className="cover-highlights">
              <p className="cover-highlights__title">
                <span className="material-icons">star_outline</span>
                Key highlights used:
              </p>
              <div className="cover-highlights__chips">
                {result.keyHighlights.map((h, i) => (
                  <span key={i} className="highlight-chip">{h}</span>
                ))}
              </div>
            </div>
          )}

          {/* Cover letter text */}
          <div className="cover-output__toolbar">
            <span className="cover-output__tone">
              <span className="material-icons">tune</span>
              Tone: {result.toneUsed || form.tone}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn--ghost btn--sm" onClick={handleCopy}>
                <span className="material-icons">{copied ? 'check' : 'content_copy'}</span>
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button className="btn btn--ghost btn--sm" onClick={handleDownload}>
                <span className="material-icons">download</span>
                Download
              </button>
              <button className="btn btn--secondary btn--sm" onClick={handleSubmit}>
                <span className="material-icons">refresh</span>
                Regenerate
              </button>
            </div>
          </div>

          <div className="cover-letter-text">
            {result.coverLetter.split('\n').map((line, i) => (
              <p key={i} className={line.trim() === '' ? 'cover-letter-gap' : ''}>{line}</p>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      {!result && !generating && (
        <div className="cover-tips card">
          <h4 className="cover-tips__title">
            <span className="material-icons">lightbulb_outline</span>
            Tips for a great cover letter
          </h4>
          <ul className="cover-tips__list">
            <li>Paste the full job description for a precisely tailored letter</li>
            <li>Upload and analyse your resume first — the AI uses your profile data</li>
            <li>Try different tones to match the company culture</li>
            <li>Personalise the output: add specific project names or metrics before sending</li>
          </ul>
        </div>
      )}
    </div>
  );
}
