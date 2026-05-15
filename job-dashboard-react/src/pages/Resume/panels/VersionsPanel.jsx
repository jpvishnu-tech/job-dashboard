import { useState, useEffect, useCallback } from 'react';
import { useAuth }                          from '../../../context/AuthContext';
import {
  getTailoredVersions,
  getTailoredVersion,
  deleteTailoredVersion,
} from '../../../services/resumeOptimizer';

// ── helpers ───────────────────────────────────────────────────

function fmtDate(val) {
  if (!val) return '';
  return new Date(val).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function scoreColor(n) {
  if (n >= 80) return '#22c55e';
  if (n >= 60) return '#f59e0b';
  return '#ef4444';
}

function DeltaBadge({ orig, proj }) {
  const d = Math.round((proj ?? 0) - (orig ?? 0));
  const cls = d > 0 ? 'rv-delta rv-delta--positive'
            : d < 0 ? 'rv-delta rv-delta--negative'
            : 'rv-delta rv-delta--neutral';
  return <span className={cls}>{d >= 0 ? '+' : ''}{d} pts</span>;
}

// ── Detail modal ──────────────────────────────────────────────

function DetailModal({ id, onClose }) {
  const { getToken } = useAuth();
  const [version, setVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    getTailoredVersion(getToken, id)
      .then(d => setVersion(d.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  function copySummary() {
    if (!version?.tailoredSummary) return;
    navigator.clipboard?.writeText(version.tailoredSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const v = version;

  return (
    <div className="rv-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="rv-modal">
        <div className="rv-modal-header">
          <div>
            <div className="rv-modal-title">
              {v?.jobTitle || 'Tailored Resume'}{v?.jobCompany ? ` — ${v.jobCompany}` : ''}
            </div>
            <div className="rv-modal-sub">{v ? fmtDate(v.createdAt) : ''}</div>
          </div>
          <button className="rv-modal-close" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="rv-modal-body">
          {loading && <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>}
          {error   && <div className="inline-error"><span className="material-icons" style={{ fontSize: 16 }}>error_outline</span>{error}</div>}

          {v && (
            <>
              {/* Score comparison */}
              <div>
                <div className="rv-modal-section-title">ATS Score Improvement</div>
                <div className="rv-detail-scores">
                  <div className="rv-detail-score">
                    <div className="rv-detail-score-val" style={{ color: scoreColor(v.originalAtsScore ?? 0) }}>
                      {v.originalAtsScore ?? '—'}%
                    </div>
                    <div className="rv-detail-score-label">Current ATS</div>
                  </div>
                  <span className="material-icons rv-detail-arrow">arrow_forward</span>
                  <div className="rv-detail-score">
                    <div className="rv-detail-score-val" style={{ color: scoreColor(v.projectedAtsScore ?? 0) }}>
                      {v.projectedAtsScore ?? '—'}%
                    </div>
                    <div className="rv-detail-score-label">Projected ATS</div>
                  </div>
                  <DeltaBadge orig={v.originalAtsScore} proj={v.projectedAtsScore} />
                </div>
              </div>

              {/* Tailored summary */}
              {v.tailoredSummary && (
                <div>
                  <div className="rv-modal-section-title">Tailored Professional Summary</div>
                  <div className="rt-summary-box">
                    <p className="rt-summary-text">{v.tailoredSummary}</p>
                    <button className="rt-copy-btn" onClick={copySummary}>
                      <span className="material-icons" style={{ fontSize: 15 }}>
                        {copied ? 'check' : 'content_copy'}
                      </span>
                      {copied ? 'Copied!' : 'Copy Summary'}
                    </button>
                  </div>
                </div>
              )}

              {/* Keywords */}
              {v.keywordsToIncorporate?.length > 0 && (
                <div>
                  <div className="rv-modal-section-title">Keywords to Add</div>
                  <div className="rt-keyword-wrap">
                    {v.keywordsToIncorporate.map(kw => (
                      <span key={kw} className="rt-keyword-chip">{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing skills */}
              {(v.missingSkills?.critical?.length > 0 || v.missingSkills?.important?.length > 0) && (
                <div>
                  <div className="rv-modal-section-title">Missing Skills</div>
                  <div className="rt-skills-groups">
                    {v.missingSkills.critical?.length > 0 && (
                      <div className="rt-skill-group">
                        <div className="rt-skill-group-label rt-skill-group-label--critical">Critical</div>
                        <div className="rt-skill-chips">
                          {v.missingSkills.critical.map(s => (
                            <span key={s} className="rt-skill-chip rt-skill-chip--critical">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {v.missingSkills.important?.length > 0 && (
                      <div className="rt-skill-group">
                        <div className="rt-skill-group-label rt-skill-group-label--important">Important</div>
                        <div className="rt-skill-chips">
                          {v.missingSkills.important.map(s => (
                            <span key={s} className="rt-skill-chip rt-skill-chip--important">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Top recommendations */}
              {v.topRecommendations?.length > 0 && (
                <div>
                  <div className="rv-modal-section-title">Top Recommendations</div>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Version card ──────────────────────────────────────────────

function VersionCard({ version, onView, onDelete, deleting }) {
  const d = Math.round((version.projectedAtsScore ?? 0) - (version.originalAtsScore ?? 0));

  return (
    <div className="rv-card">
      <div className="rv-card-top">
        <div className="rv-job-info">
          <div className="rv-job-title">{version.jobTitle || 'Untitled Job'}</div>
          {version.jobCompany && <div className="rv-job-company">{version.jobCompany}</div>}
        </div>
        <div className="rv-date">{fmtDate(version.createdAt)}</div>
      </div>

      <div className="rv-score-row">
        <div className="rv-score-item">
          <span className="rv-score-label">Current</span>
          <span className="rv-score-val" style={{ color: scoreColor(version.originalAtsScore ?? 0) }}>
            {version.originalAtsScore ?? '—'}%
          </span>
        </div>
        <span className="material-icons rv-score-arrow">arrow_forward</span>
        <div className="rv-score-item">
          <span className="rv-score-label">Projected</span>
          <span className="rv-score-val" style={{ color: scoreColor(version.projectedAtsScore ?? 0) }}>
            {version.projectedAtsScore ?? '—'}%
          </span>
        </div>
        <DeltaBadge orig={version.originalAtsScore} proj={version.projectedAtsScore} />
      </div>

      {version.topRecommendations?.slice(0, 2).map((r, i) => (
        <div key={i} className="rv-rec">• {r}</div>
      ))}

      <div className="rv-actions">
        <button className="rv-btn rv-btn--view" onClick={() => onView(version._id)}>
          <span className="material-icons" style={{ fontSize: 16 }}>open_in_new</span>
          View Details
        </button>
        <button
          className="rv-btn rv-btn--delete"
          onClick={() => onDelete(version._id)}
          disabled={deleting === version._id}
        >
          <span className="material-icons" style={{ fontSize: 16 }}>delete_outline</span>
        </button>
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────

export default function VersionsPanel({ hasResume }) {
  const { getToken } = useAuth();

  const [versions,  setVersions]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [page,      setPage]      = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalId,   setModalId]   = useState(null);
  const [deleting,  setDeleting]  = useState(null);

  const fetchVersions = useCallback(async (p = 1) => {
    setLoading(true);
    setError('');
    try {
      const data = await getTailoredVersions(getToken, p, 12);
      setVersions(data.data.versions);
      setTotalPages(data.data.pagination.pages);
      setPage(p);
    } catch (err) {
      setError(err.message || 'Failed to load versions.');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchVersions(1); }, [fetchVersions]);

  async function handleDelete(id) {
    if (!confirm('Delete this tailored version? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await deleteTailoredVersion(getToken, id);
      setVersions(vs => vs.filter(v => v._id !== id));
    } catch (err) {
      alert(err.message || 'Delete failed.');
    } finally {
      setDeleting(null);
    }
  }

  if (!hasResume) {
    return (
      <div className="rv-empty">
        <span className="material-icons">bookmarks</span>
        <h3>No Resume Uploaded</h3>
        <p>Upload a PDF resume and tailor it for jobs to see your saved versions here.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rv-panel">
        <div className="inline-error">
          <span className="material-icons" style={{ fontSize: 16 }}>error_outline</span>
          {error}
        </div>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="rv-empty">
        <span className="material-icons">bookmarks</span>
        <h3>No Saved Versions Yet</h3>
        <p>Use the <strong>Job Tailor</strong> tab to tailor your resume for a job — versions are saved automatically.</p>
      </div>
    );
  }

  return (
    <div className="rv-panel">
      <div className="rv-header">
        <div className="rv-title">Saved Tailored Versions</div>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {versions.length} version{versions.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="rv-grid">
        {versions.map(v => (
          <VersionCard
            key={v._id}
            version={v}
            onView={setModalId}
            onDelete={handleDelete}
            deleting={deleting}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="rv-pagination">
          <button
            className="rv-page-btn"
            onClick={() => fetchVersions(page - 1)}
            disabled={page <= 1}
          >
            <span className="material-icons">chevron_left</span>
          </button>
          <span className="rv-page-info">Page {page} of {totalPages}</span>
          <button
            className="rv-page-btn"
            onClick={() => fetchVersions(page + 1)}
            disabled={page >= totalPages}
          >
            <span className="material-icons">chevron_right</span>
          </button>
        </div>
      )}

      {modalId && (
        <DetailModal id={modalId} onClose={() => setModalId(null)} />
      )}
    </div>
  );
}
