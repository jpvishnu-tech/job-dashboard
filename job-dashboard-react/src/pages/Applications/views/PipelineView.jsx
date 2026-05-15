import { useState } from 'react';

export const STAGE_META = {
  saved:                { label: 'Saved',               color: '#64748b', bg: '#f1f5f9', icon: 'bookmark'          },
  applied:              { label: 'Applied',              color: '#3b82f6', bg: '#dbeafe', icon: 'send'               },
  under_review:         { label: 'Under Review',         color: '#8b5cf6', bg: '#ede9fe', icon: 'search'             },
  interview_scheduled:  { label: 'Interview Scheduled',  color: '#f59e0b', bg: '#fef3c7', icon: 'event'              },
  interview_completed:  { label: 'Interview Completed',  color: '#06b6d4', bg: '#cffafe', icon: 'how_to_reg'         },
  offer_received:       { label: 'Offer Received',       color: '#10b981', bg: '#d1fae5', icon: 'celebration'        },
  hired:                { label: 'Hired',                color: '#059669', bg: '#a7f3d0', icon: 'workspace_premium'  },
  rejected:             { label: 'Rejected',             color: '#ef4444', bg: '#fee2e2', icon: 'cancel'             },
};

const VISIBLE_STAGES = [
  'saved', 'applied', 'under_review',
  'interview_scheduled', 'interview_completed',
  'offer_received', 'hired', 'rejected',
];

const PRIORITY_DOT = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };

function AppCard({ app, onMove, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = app.company?.slice(0, 2).toUpperCase() ?? '?';
  const daysAgo  = app.appliedAt
    ? Math.floor((Date.now() - new Date(app.appliedAt).getTime()) / 86400000)
    : null;

  return (
    <div className="pipeline-card">
      <div className="pipeline-card__top">
        <div className="pipeline-card__logo">{initials}</div>
        <div className="pipeline-card__meta">
          <span className="pipeline-card__role">{app.role}</span>
          <span className="pipeline-card__company">{app.company}</span>
        </div>
        <div className="pipeline-card__actions">
          <div
            className="pipeline-card__priority"
            style={{ background: PRIORITY_DOT[app.priority] || PRIORITY_DOT.medium }}
            title={`Priority: ${app.priority}`}
          />
          <button className="pipeline-card__menu-btn" onClick={() => setMenuOpen(v => !v)}>
            <span className="material-icons">more_vert</span>
          </button>
          {menuOpen && (
            <div className="pipeline-card__dropdown" onClick={() => setMenuOpen(false)}>
              <button onClick={() => onEdit(app)}>
                <span className="material-icons">edit</span> Edit
              </button>
              <button onClick={() => onDelete(app._id)} style={{ color: 'var(--color-red)' }}>
                <span className="material-icons">delete_outline</span> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {app.location && (
        <div className="pipeline-card__location">
          <span className="material-icons">place</span>{app.location}
        </div>
      )}

      {app.salary && (
        <div className="pipeline-card__salary">
          <span className="material-icons">payments</span>{app.salary}
        </div>
      )}

      {app.tags?.length > 0 && (
        <div className="pipeline-card__tags">
          {app.tags.slice(0, 3).map(t => (
            <span key={t} className="pipeline-tag">{t}</span>
          ))}
        </div>
      )}

      <div className="pipeline-card__footer">
        {daysAgo !== null && (
          <span className="pipeline-card__date">
            {daysAgo === 0 ? 'today' : `${daysAgo}d ago`}
          </span>
        )}
        {app.matchScore != null && (
          <span className="pipeline-card__score" title="AI match score">
            <span className="material-icons">auto_awesome</span>{app.matchScore}
          </span>
        )}
        <div className="pipeline-card__move">
          <select
            value={app.status}
            onChange={e => onMove(app._id, e.target.value)}
            onClick={e => e.stopPropagation()}
            className="pipeline-card__move-select"
          >
            {VISIBLE_STAGES.map(s => (
              <option key={s} value={s}>{STAGE_META[s]?.label ?? s}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default function PipelineView({ applications, onStatusChange, onEdit, onDelete, loading }) {
  const byStage = {};
  for (const s of VISIBLE_STAGES) byStage[s] = [];
  for (const app of applications) {
    const stage = VISIBLE_STAGES.includes(app.status) ? app.status : 'saved';
    byStage[stage].push(app);
  }

  if (loading) {
    return (
      <div className="pipeline-board">
        {VISIBLE_STAGES.map(s => (
          <div key={s} className="pipeline-col">
            <div className="pipeline-col__header" style={{ borderTop: `3px solid ${STAGE_META[s].color}` }}>
              <span>{STAGE_META[s].label}</span>
              <span className="pipeline-col__count">—</span>
            </div>
            <div className="pipeline-col__body">
              {[1, 2].map(i => <div key={i} className="pipeline-card-skeleton" />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="pipeline-board">
      {VISIBLE_STAGES.map(stage => {
        const meta  = STAGE_META[stage];
        const cards = byStage[stage];
        return (
          <div key={stage} className="pipeline-col">
            <div className="pipeline-col__header" style={{ borderTop: `3px solid ${meta.color}` }}>
              <div className="pipeline-col__title">
                <span className="material-icons" style={{ color: meta.color, fontSize: 16 }}>{meta.icon}</span>
                <span>{meta.label}</span>
              </div>
              <span
                className="pipeline-col__count"
                style={{ background: meta.bg, color: meta.color }}
              >
                {cards.length}
              </span>
            </div>
            <div className="pipeline-col__body">
              {cards.length === 0 ? (
                <div className="pipeline-col__empty">
                  <span className="material-icons">inbox</span>
                  <span>No applications</span>
                </div>
              ) : (
                cards.map(app => (
                  <AppCard
                    key={app._id}
                    app={app}
                    onMove={onStatusChange}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
