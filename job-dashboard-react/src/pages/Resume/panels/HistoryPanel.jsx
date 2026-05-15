import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getHistory } from '../../../services/resumeOptimizer';

function clr(n) {
  if (n >= 75) return '#16a34a';
  if (n >= 55) return 'var(--color-primary)';
  if (n >= 35) return '#d97706';
  return '#dc2626';
}

function fmtDate(val) {
  if (!val) return '';
  return new Date(val).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const TYPE_META = {
  analyze:  { label: 'ATS Analysis',   icon: 'psychology',     color: 'var(--color-primary)', bg: 'rgba(99,102,241,0.1)' },
  match:    { label: 'Job Match',       icon: 'compare_arrows', color: '#0284c7',               bg: '#e0f2fe' },
  optimize: { label: 'Job Optimizer',   icon: 'tune',           color: '#d97706',               bg: '#fef3c7' },
  rewrite:  { label: 'AI Rewrite',      icon: 'auto_fix_high',  color: '#16a34a',               bg: '#dcfce7' },
};

function HistoryCard({ item }) {
  const [open, setOpen] = useState(false);
  const meta    = TYPE_META[item.type] || TYPE_META.analyze;
  const score   = item.atsScore ?? item.matchScore ?? item.optimizationScore ?? null;
  const scoreLabel = item.type === 'match' ? 'Match' : item.type === 'optimize' ? 'Fit' : 'ATS';

  return (
    <div className="ro-history-card">
      <div className="ro-history-card__head" onClick={() => setOpen(o => !o)}>
        <div className="ro-history-card__left">
          <span className="ro-history-badge" style={{ color: meta.color, background: meta.bg }}>
            <span className="material-icons">{meta.icon}</span>
            {meta.label}
          </span>
          {item.targetRole && (
            <span className="ro-history-role">
              <span className="material-icons">work</span>
              {item.targetRole}
            </span>
          )}
          {item.targetSection && (
            <span className="ro-history-role">
              <span className="material-icons">edit</span>
              {item.targetSection}
            </span>
          )}
        </div>
        <div className="ro-history-card__right">
          {score !== null && (
            <span className="ro-history-score" style={{ color: clr(score) }}>
              {score} <small>{scoreLabel}</small>
            </span>
          )}
          <span className="ro-history-date">{fmtDate(item.createdAt)}</span>
          <span className="material-icons ro-history-chevron" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>
            expand_more
          </span>
        </div>
      </div>

      {open && (
        <div className="ro-history-card__body">
          {/* ATS / analyze */}
          {item.type === 'analyze' && (
            <>
              {item.overallFeedback && <p className="ro-feedback">{item.overallFeedback}</p>}
              <div className="ro-history-mini-grid">
                {item.formattingScore != null && <span>Formatting: <strong style={{ color: clr(item.formattingScore) }}>{item.formattingScore}</strong></span>}
                {item.contentScore != null && <span>Content: <strong style={{ color: clr(item.contentScore) }}>{item.contentScore}</strong></span>}
                {item.keywordRelevanceScore != null && <span>Keywords: <strong style={{ color: clr(item.keywordRelevanceScore) }}>{item.keywordRelevanceScore}</strong></span>}
                {item.recruiterVisibilityScore != null && <span>Visibility: <strong style={{ color: clr(item.recruiterVisibilityScore) }}>{item.recruiterVisibilityScore}</strong></span>}
              </div>
              {item.strengths?.length > 0 && (
                <div className="ro-history-lists">
                  <div>
                    <strong>Strengths</strong>
                    <ul>{item.strengths.slice(0, 4).map((s, i) => <li key={i}>{s}</li>)}</ul>
                  </div>
                  {item.weaknesses?.length > 0 && (
                    <div>
                      <strong>Weaknesses</strong>
                      <ul>{item.weaknesses.slice(0, 4).map((w, i) => <li key={i}>{w}</li>)}</ul>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Match */}
          {item.type === 'match' && (
            <>
              {item.matchAssessment && <p className="ro-feedback">{item.matchAssessment}</p>}
              {item.matchingKeywords?.length > 0 && (
                <div className="ro-tags-row">
                  <span className="ro-tags-label">Matching:</span>
                  {item.matchingKeywords.slice(0, 8).map((k, i) => <span key={i} className="ro-tag ro-tag--skill">{k}</span>)}
                </div>
              )}
              {item.missingKeywords?.length > 0 && (
                <div className="ro-tags-row">
                  <span className="ro-tags-label">Missing:</span>
                  {item.missingKeywords.slice(0, 8).map((k, i) => <span key={i} className="ro-tag ro-tag--red">{k}</span>)}
                </div>
              )}
            </>
          )}

          {/* Optimize */}
          {item.type === 'optimize' && (
            <>
              {item.overallFeedback && <p className="ro-feedback">{item.overallFeedback}</p>}
              {item.tailoredRecommendations?.length > 0 && (
                <ul className="ro-list ro-list--compact">
                  {item.tailoredRecommendations.slice(0, 5).map((r, i) => (
                    <li key={i}><span className="material-icons" style={{ fontSize: 13 }}>arrow_forward</span>{r}</li>
                  ))}
                </ul>
              )}
            </>
          )}

          {/* Rewrite */}
          {item.type === 'rewrite' && (
            <>
              {item.rewrittenSummary && (
                <blockquote className="ro-rewrite-output">{item.rewrittenSummary.slice(0, 400)}</blockquote>
              )}
              {item.improvementNotes?.length > 0 && (
                <ul className="ro-list ro-list--compact">
                  {item.improvementNotes.slice(0, 4).map((n, i) => (
                    <li key={i}><span className="material-icons" style={{ fontSize: 13 }}>check</span>{n}</li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function HistoryPanel({ hasResume }) {
  const { user } = useAuth();
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const [pages,    setPages]    = useState(1);

  const LIMIT = 10;

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    setError('');
    try {
      const data = await getHistory(() => user.getIdToken(), p, LIMIT);
      setItems(data.data || []);
      setTotal(data.pagination?.total ?? 0);
      setPages(data.pagination?.totalPages ?? 1);
      setPage(p);
    } catch (err) {
      setError(err.message || 'Failed to load history.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (hasResume) load(1);
  }, [hasResume, load]);

  if (!hasResume) {
    return (
      <div className="ro-empty-state">
        <span className="material-icons ro-empty-state__icon">history</span>
        <p>Upload a resume to view your AI analysis history.</p>
      </div>
    );
  }

  return (
    <div className="ro-panel">
      <div className="ro-panel__header">
        <div>
          <h3 className="ro-panel__title">Analysis History</h3>
          <p className="ro-panel__sub">All AI analyses saved for your resume — ATS, job match, optimizer, and rewrites.</p>
        </div>
        {total > 0 && <span className="ro-count-badge">{total} total</span>}
      </div>

      {error && (
        <div className="ro-error">
          <span className="material-icons">error_outline</span>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div className="spinner" />
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <div className="ro-empty-state">
          <span className="material-icons ro-empty-state__icon">history_toggle_off</span>
          <p>No analyses yet. Run an ATS Analysis or Job Optimizer to see history here.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <>
          <div className="ro-history-list">
            {items.map((item, i) => <HistoryCard key={item._id || i} item={item} />)}
          </div>

          {pages > 1 && (
            <div className="ro-pagination">
              <button className="btn btn--secondary btn--sm" onClick={() => load(page - 1)} disabled={page <= 1}>
                <span className="material-icons">chevron_left</span>
              </button>
              <span className="ro-pagination__info">Page {page} of {pages}</span>
              <button className="btn btn--secondary btn--sm" onClick={() => load(page + 1)} disabled={page >= pages}>
                <span className="material-icons">chevron_right</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
