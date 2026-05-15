import { useState, useCallback } from 'react';
import { useAuth }               from '../../../context/AuthContext';
import { tailorResume }          from '../../../services/resumeOptimizer';

// ── helpers ───────────────────────────────────────────────────

function scoreColor(n) {
  if (n >= 80) return '#22c55e';
  if (n >= 60) return '#f59e0b';
  return '#ef4444';
}

function ScoreRing({ score, label, sub }) {
  const R = 32;
  const C = 2 * Math.PI * R;
  const pct   = Math.max(0, Math.min(100, score ?? 0));
  const offset = C * (1 - pct / 100);
  const color  = scoreColor(pct);
  return (
    <div className="rt-score-block">
      <div className="rt-ring">
        <svg width={80} height={80} viewBox="0 0 80 80">
          <circle className="rt-ring__track" cx={40} cy={40} r={R} />
          <circle
            className="rt-ring__fill"
            cx={40} cy={40} r={R}
            style={{ stroke: color }}
            strokeDasharray={C}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="rt-ring__label">
          <span className="rt-ring__num" style={{ color }}>{pct}</span>
          <span className="rt-ring__pct">%</span>
        </div>
      </div>
      <span className="rt-score-label">{label}</span>
      {sub && <span className="rt-score-sub">{sub}</span>}
    </div>
  );
}

function ImpactBadge({ impact }) {
  return (
    <span className={`rt-bullet-impact rt-bullet-impact--${impact}`}>
      {impact} impact
    </span>
  );
}

function BulletRewrite({ item, idx }) {
  const [open, setOpen] = useState(idx === 0);
  const copy = useCallback(() => navigator.clipboard?.writeText(item.tailored), [item.tailored]);

  return (
    <div className="rt-bullet-item">
      <div className="rt-bullet-header" onClick={() => setOpen(o => !o)}>
        <span className="rt-bullet-preview">{item.tailored?.slice(0, 70)}…</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <ImpactBadge impact={item.impact || 'medium'} />
          <span className="material-icons" style={{ fontSize: 18, color: 'var(--text-secondary)' }}>
            {open ? 'expand_less' : 'expand_more'}
          </span>
        </div>
      </div>

      {open && (
        <div className="rt-bullet-body">
          {item.original && (
            <div>
              <div className="rt-bullet-label">Original</div>
              <div className="rt-bullet-before">{item.original}</div>
            </div>
          )}
          <div style={{ marginTop: item.original ? 10 : 0 }}>
            <div className="rt-bullet-label">Tailored</div>
            <div className="rt-bullet-after">{item.tailored}</div>
          </div>
          {item.addedKeywords?.length > 0 && (
            <div className="rt-keywords-added">
              {item.addedKeywords.map(kw => (
                <span key={kw} className="rt-kw-pill">{kw}</span>
              ))}
            </div>
          )}
          <button className="rt-copy-btn" onClick={copy} style={{ marginTop: 10 }}>
            <span className="material-icons" style={{ fontSize: 15 }}>content_copy</span>
            Copy
          </button>
        </div>
      )}
    </div>
  );
}

function SectionImprovement({ item }) {
  return (
    <div className="rt-improvement">
      <div className="rt-improvement-header">
        <span className="rt-improvement-section">{item.section}</span>
        <span className="rt-improvement-type">{item.type}</span>
      </div>
      {item.original && (
        <div className="rt-improvement-before">{item.original}</div>
      )}
      {item.improved && (
        <div className="rt-improvement-after">{item.improved}</div>
      )}
      {item.reason && (
        <div className="rt-improvement-reason">{item.reason}</div>
      )}
    </div>
  );
}

// ── main component ────────────────────────────────────────────

export default function TailorPanel({ hasResume }) {
  const { getToken } = useAuth();

  const [jobTitle,      setJobTitle]      = useState('');
  const [jobCompany,    setJobCompany]    = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [result,        setResult]        = useState(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  if (!hasResume) {
    return (
      <div className="rt-empty">
        <span className="material-icons">content_cut</span>
        <h3>Upload a Resume First</h3>
        <p>Upload your PDF resume above to start tailoring it for specific jobs.</p>
      </div>
    );
  }

  async function handleTailor() {
    if (!jobDescription.trim() || jobDescription.trim().length < 50) {
      setError('Please paste a job description (at least 50 characters).');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const data = await tailorResume(getToken, jobDescription, jobTitle, jobCompany);
      setResult(data.data);
    } catch (err) {
      setError(err.message || 'Tailoring failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function copySummary() {
    navigator.clipboard?.writeText(result.version.tailoredSummary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  }

  const v = result?.version;

  const delta = v
    ? Math.round((v.projectedAtsScore ?? 0) - (v.originalAtsScore ?? 0))
    : 0;

  return (
    <div className="rt-panel">

      {/* ── Input form ──────────────────────────────────────── */}
      <div className="rt-form">
        <div className="rt-form-row">
          <div className="rt-form-field">
            <label>Job Title <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
            <input
              type="text"
              placeholder="e.g. Senior Software Engineer"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
            />
          </div>
          <div className="rt-form-field">
            <label>Company <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
            <input
              type="text"
              placeholder="e.g. Google"
              value={jobCompany}
              onChange={e => setJobCompany(e.target.value)}
            />
          </div>
        </div>

        <div className="rt-jd-label">
          Job Description <span style={{ color: '#ef4444' }}>*</span>
        </div>
        <textarea
          className="rt-jd-area"
          placeholder="Paste the full job description here. The more detail you provide, the better the tailoring…"
          value={jobDescription}
          onChange={e => setJobDescription(e.target.value)}
          rows={8}
        />

        {error && (
          <div className="inline-error" style={{ marginTop: 10 }}>
            <span className="material-icons" style={{ fontSize: 16 }}>error_outline</span>
            {error}
          </div>
        )}

        <button
          className="rt-tailor-btn"
          onClick={handleTailor}
          disabled={loading}
        >
          {loading
            ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />Tailoring your resume…</>
            : <><span className="material-icons">content_cut</span>Tailor Resume with AI</>
          }
        </button>
      </div>

      {/* ── Results ─────────────────────────────────────────── */}
      {v && (
        <div className="rt-results">

          {/* Score improvement row */}
          <div className="rt-score-row">
            <ScoreRing score={v.originalAtsScore}  label="Current ATS" />
            <span className="rt-score-arrow material-icons">arrow_forward</span>
            <ScoreRing score={v.projectedAtsScore} label="Projected ATS" />
            <div
              className={`rt-score-delta${delta < 0 ? ' rt-score-delta--negative' : ''}`}
              style={{ marginLeft: 'auto' }}
            >
              {delta >= 0 ? '+' : ''}{delta} pts
            </div>
          </div>

          {/* Tailored summary */}
          {v.tailoredSummary && (
            <div className="rt-section">
              <div className="rt-section-title">
                <span className="material-icons">format_quote</span>
                Tailored Professional Summary
              </div>
              <div className="rt-summary-box">
                <p className="rt-summary-text">{v.tailoredSummary}</p>
                <button className="rt-copy-btn" onClick={copySummary}>
                  <span className="material-icons" style={{ fontSize: 15 }}>
                    {copiedSummary ? 'check' : 'content_copy'}
                  </span>
                  {copiedSummary ? 'Copied!' : 'Copy Summary'}
                </button>
              </div>
            </div>
          )}

          {/* Keywords to incorporate */}
          {v.keywordsToIncorporate?.length > 0 && (
            <div className="rt-section">
              <div className="rt-section-title">
                <span className="material-icons">label</span>
                Keywords to Incorporate
              </div>
              <div className="rt-keyword-wrap">
                {v.keywordsToIncorporate.map(kw => (
                  <span key={kw} className="rt-keyword-chip">{kw}</span>
                ))}
              </div>
            </div>
          )}

          {/* Missing skills */}
          {(v.missingSkills?.critical?.length > 0 ||
            v.missingSkills?.important?.length > 0 ||
            v.missingSkills?.niceToHave?.length > 0) && (
            <div className="rt-section">
              <div className="rt-section-title">
                <span className="material-icons">warning_amber</span>
                Missing Skills
              </div>
              <div className="rt-skills-groups">
                {v.missingSkills.critical?.length > 0 && (
                  <div className="rt-skill-group">
                    <div className="rt-skill-group-label rt-skill-group-label--critical">
                      Critical — must have
                    </div>
                    <div className="rt-skill-chips">
                      {v.missingSkills.critical.map(s => (
                        <span key={s} className="rt-skill-chip rt-skill-chip--critical">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {v.missingSkills.important?.length > 0 && (
                  <div className="rt-skill-group">
                    <div className="rt-skill-group-label rt-skill-group-label--important">
                      Important — should have
                    </div>
                    <div className="rt-skill-chips">
                      {v.missingSkills.important.map(s => (
                        <span key={s} className="rt-skill-chip rt-skill-chip--important">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {v.missingSkills.niceToHave?.length > 0 && (
                  <div className="rt-skill-group">
                    <div className="rt-skill-group-label rt-skill-group-label--nice">
                      Nice to have
                    </div>
                    <div className="rt-skill-chips">
                      {v.missingSkills.niceToHave.map(s => (
                        <span key={s} className="rt-skill-chip rt-skill-chip--nice">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bullet rewrites */}
          {v.bulletRewrites?.length > 0 && (
            <div className="rt-section">
              <div className="rt-section-title">
                <span className="material-icons">edit_note</span>
                Bullet Point Rewrites ({v.bulletRewrites.length})
              </div>
              <div className="rt-bullet-list">
                {v.bulletRewrites.map((item, i) => (
                  <BulletRewrite key={i} item={item} idx={i} />
                ))}
              </div>
            </div>
          )}

          {/* Section improvements */}
          {v.sectionImprovements?.length > 0 && (
            <div className="rt-section">
              <div className="rt-section-title">
                <span className="material-icons">layers</span>
                Section Improvements ({v.sectionImprovements.length})
              </div>
              <div className="rt-improvements">
                {v.sectionImprovements.map((item, i) => (
                  <SectionImprovement key={i} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Skills to add / highlight */}
          {v.skillsToAdd?.length > 0 && (
            <div className="rt-section">
              <div className="rt-section-title">
                <span className="material-icons">add_circle_outline</span>
                Skills to Add to Your Resume
              </div>
              <div className="rt-skill-chips">
                {v.skillsToAdd.map(s => (
                  <span key={s} className="rt-skill-chip rt-skill-chip--important">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Top recommendations */}
          {v.topRecommendations?.length > 0 && (
            <div className="rt-section">
              <div className="rt-section-title">
                <span className="material-icons">lightbulb</span>
                Top Recommendations
              </div>
              <div className="rt-recs">
                {v.topRecommendations.map((rec, i) => (
                  <div key={i} className="rt-rec">
                    <div className="rt-rec-num">{i + 1}</div>
                    <div className="rt-rec-text">{rec}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Version saved note */}
          <div className="rt-saved-note">
            <span className="material-icons">check_circle</span>
            This tailored version has been saved automatically. View it in the <strong>Saved Versions</strong> tab.
          </div>
        </div>
      )}
    </div>
  );
}
