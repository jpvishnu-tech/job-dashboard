import { useState } from 'react';
import { useAuth }  from '../../../context/AuthContext';
import { rewriteSection } from '../../../services/resumeOptimizer';

const SECTIONS = [
  { value: 'summary',    label: 'Professional Summary', placeholder: 'Paste your current summary here…', icon: 'person' },
  { value: 'bullets',   label: 'Experience Bullets',   placeholder: 'Paste your work experience bullets here (one per line)…', icon: 'work_history' },
  { value: 'skills',    label: 'Skills Section',        placeholder: 'Paste your skills section content here…', icon: 'psychology' },
  { value: 'projects',  label: 'Projects',              placeholder: 'Paste your projects section here…', icon: 'folder_open' },
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button className="ro-copy-btn" onClick={copy} title="Copy to clipboard">
      <span className="material-icons">{copied ? 'check' : 'content_copy'}</span>
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function SummaryResult({ result }) {
  const versions = result.rewrittenBullets?.versions || [];
  return (
    <div className="ro-result">
      <div className="ro-card ro-card--primary">
        <div className="ro-rewrite-head">
          <h4 className="ro-card__title"><span className="material-icons">auto_awesome</span> Rewritten Summary</h4>
          <CopyButton text={result.rewrittenSummary} />
        </div>
        <blockquote className="ro-rewrite-output">{result.rewrittenSummary}</blockquote>
      </div>

      {versions.length > 0 && (
        <div className="ro-card">
          <h4 className="ro-card__title"><span className="material-icons">format_list_bulleted</span> Alternative Versions</h4>
          {versions.map((v, i) => (
            <div key={i} className="ro-alt-version">
              <span className="ro-alt-version__num">v{i + 2}</span>
              <blockquote className="ro-rewrite-output ro-rewrite-output--sm">{v}</blockquote>
              <CopyButton text={v} />
            </div>
          ))}
        </div>
      )}

      {result.improvementNotes?.length > 0 && (
        <div className="ro-card">
          <h4 className="ro-card__title"><span className="material-icons">lightbulb</span> What Changed</h4>
          <ul className="ro-list">
            {result.improvementNotes.map((n, i) => (
              <li key={i}>
                <span className="material-icons" style={{ fontSize: 14, color: 'var(--color-primary)' }}>check</span>
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.keywordsAdded?.length > 0 && (
        <div className="ro-tags-row">
          <span className="ro-tags-label">Keywords Added:</span>
          {result.keywordsAdded.map((k, i) => <span key={i} className="ro-tag ro-tag--skill">{k}</span>)}
        </div>
      )}
    </div>
  );
}

function BulletsResult({ result }) {
  const bullets = result.rewrittenBullets?.bullets || [];
  const tips    = result.rewrittenBullets?.generalTips || [];
  const verbs   = result.rewrittenBullets?.powerVerbs || [];

  return (
    <div className="ro-result">
      {bullets.length > 0 && (
        <div className="ro-card">
          <h4 className="ro-card__title"><span className="material-icons">auto_awesome</span> Rewritten Bullets</h4>
          <div className="ro-bullet-list">
            {bullets.map((b, i) => (
              <div key={i} className="ro-bullet-item">
                <div className="ro-bullet-compare">
                  <div className="ro-bullet-before">
                    <span className="ro-bullet-label ro-bullet-label--before">Before</span>
                    <span>{b.original}</span>
                  </div>
                  <div className="ro-bullet-after">
                    <span className="ro-bullet-label ro-bullet-label--after">After</span>
                    <div className="ro-bullet-after__row">
                      <span>{b.rewritten}</span>
                      <CopyButton text={b.rewritten} />
                    </div>
                  </div>
                </div>
                {b.improvement && (
                  <p className="ro-bullet-note">{b.improvement}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tips.length > 0 && (
        <div className="ro-card">
          <h4 className="ro-card__title"><span className="material-icons">tips_and_updates</span> General Tips</h4>
          <ul className="ro-list">
            {tips.map((t, i) => (
              <li key={i}>
                <span className="material-icons" style={{ fontSize: 14, color: 'var(--color-primary)' }}>arrow_forward</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {verbs.length > 0 && (
        <div className="ro-tags-row">
          <span className="ro-tags-label">Power Verbs Used:</span>
          {verbs.map((v, i) => <span key={i} className="ro-tag ro-tag--skill">{v}</span>)}
        </div>
      )}

      {result.improvementNotes?.length > 0 && (
        <div className="ro-card">
          <h4 className="ro-card__title"><span className="material-icons">lightbulb</span> Notes</h4>
          <ul className="ro-list">
            {result.improvementNotes.map((n, i) => (
              <li key={i}>
                <span className="material-icons" style={{ fontSize: 14, color: 'var(--color-primary)' }}>check</span>
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SectionResult({ result }) {
  return (
    <div className="ro-result">
      {result.rewrittenSummary && (
        <div className="ro-card ro-card--primary">
          <div className="ro-rewrite-head">
            <h4 className="ro-card__title"><span className="material-icons">auto_awesome</span> Rewritten Content</h4>
            <CopyButton text={result.rewrittenSummary} />
          </div>
          <blockquote className="ro-rewrite-output">{result.rewrittenSummary}</blockquote>
        </div>
      )}
      {result.rewrittenBullets?.changes?.length > 0 && (
        <div className="ro-card">
          <h4 className="ro-card__title"><span className="material-icons">edit</span> Key Changes</h4>
          <ul className="ro-list">
            {result.rewrittenBullets.changes.map((c, i) => (
              <li key={i}>
                <span className="material-icons" style={{ fontSize: 14, color: '#16a34a' }}>check</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.improvementNotes?.length > 0 && (
        <div className="ro-card">
          <h4 className="ro-card__title"><span className="material-icons">lightbulb</span> Why These Changes Improve ATS</h4>
          <ul className="ro-list">
            {result.improvementNotes.map((n, i) => (
              <li key={i}>
                <span className="material-icons" style={{ fontSize: 14, color: 'var(--color-primary)' }}>arrow_forward</span>
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function RewriterPanel({ hasResume }) {
  const { user } = useAuth();
  const [section,  setSection]  = useState('summary');
  const [content,  setContent]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [result,   setResult]   = useState(null);

  const selectedSec = SECTIONS.find(s => s.value === section) || SECTIONS[0];

  function handleSectionChange(val) {
    setSection(val);
    setResult(null);
    setError('');
  }

  async function handleRewrite() {
    if (content.trim().length < 10) {
      setError('Please paste some content to rewrite.');
      return;
    }
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const data = await rewriteSection(() => user.getIdToken(), section, content.trim());
      setResult(data.data.result);
    } catch (err) {
      setError(err.message || 'Rewrite failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!hasResume) {
    return (
      <div className="ro-empty-state">
        <span className="material-icons ro-empty-state__icon">edit</span>
        <p>Upload a resume to use the AI rewriter.</p>
      </div>
    );
  }

  return (
    <div className="ro-panel">
      <div className="ro-panel__header">
        <div>
          <h3 className="ro-panel__title">AI Section Rewriter</h3>
          <p className="ro-panel__sub">
            Paste any resume section — the AI rewrites it with stronger language, better quantification, and ATS-optimized keywords.
          </p>
        </div>
      </div>

      {/* Section selector */}
      <div className="ro-section-tabs">
        {SECTIONS.map(s => (
          <button
            key={s.value}
            className={`ro-section-tab ${section === s.value ? 'ro-section-tab--active' : ''}`}
            onClick={() => handleSectionChange(s.value)}
          >
            <span className="material-icons">{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      <div className="ro-form-group">
        <label className="ro-label">Current {selectedSec.label}</label>
        <textarea
          className="form-control ro-textarea"
          rows={8}
          placeholder={selectedSec.placeholder}
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <div className="ro-form-footer">
          <span className="ro-char-count">{content.length} chars</span>
          <button className="btn btn--primary" onClick={handleRewrite} disabled={loading || content.trim().length < 10}>
            {loading
              ? <><div className="spinner" style={{ width: 15, height: 15, borderWidth: 2 }} /> Rewriting…</>
              : <><span className="material-icons">auto_fix_high</span> AI Rewrite</>
            }
          </button>
        </div>
      </div>

      {error && (
        <div className="ro-error">
          <span className="material-icons">error_outline</span>
          {error}
        </div>
      )}

      {result && (
        section === 'summary'
          ? <SummaryResult result={result} />
          : section === 'bullets' || section === 'experience'
            ? <BulletsResult result={result} />
            : <SectionResult result={result} />
      )}
    </div>
  );
}
