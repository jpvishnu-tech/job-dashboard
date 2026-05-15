import { useState } from 'react';
import { STAGE_META } from './PipelineView';

const COLS = [
  { key: 'company',  label: 'Company'  },
  { key: 'role',     label: 'Role'     },
  { key: 'location', label: 'Location' },
  { key: 'status',   label: 'Stage'    },
  { key: 'priority', label: 'Priority' },
  { key: 'date',     label: 'Added'    },
];

const PRIORITY_META = {
  high:   { label: 'High',   cls: 'priority-badge--high'   },
  medium: { label: 'Medium', cls: 'priority-badge--medium' },
  low:    { label: 'Low',    cls: 'priority-badge--low'    },
};

function fmtDate(val) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ListView({ applications, onStatusChange, onEdit, onDelete, loading }) {
  const [sort, setSort]       = useState({ key: 'date', dir: 'desc' });
  const [filter, setFilter]   = useState('');
  const [stageF, setStageF]   = useState('');

  function toggleSort(key) {
    setSort(prev => prev.key === key
      ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: 'asc' }
    );
  }

  const SortIcon = ({ col }) => {
    if (sort.key !== col) return <span className="material-icons sort-icon sort-icon--idle">unfold_more</span>;
    return (
      <span className="material-icons sort-icon sort-icon--active">
        {sort.dir === 'asc' ? 'arrow_upward' : 'arrow_downward'}
      </span>
    );
  };

  let rows = [...applications];

  if (filter) {
    const q = filter.toLowerCase();
    rows = rows.filter(a =>
      a.company?.toLowerCase().includes(q) ||
      a.role?.toLowerCase().includes(q) ||
      a.location?.toLowerCase().includes(q)
    );
  }
  if (stageF) rows = rows.filter(a => a.status === stageF);

  rows.sort((a, b) => {
    let va, vb;
    if (sort.key === 'company')  { va = a.company  || ''; vb = b.company  || ''; }
    else if (sort.key === 'role'){ va = a.role      || ''; vb = b.role     || ''; }
    else if (sort.key === 'status') { va = a.status || ''; vb = b.status   || ''; }
    else if (sort.key === 'priority') {
      const order = { high: 0, medium: 1, low: 2 };
      va = order[a.priority] ?? 1;
      vb = order[b.priority] ?? 1;
    } else {
      va = new Date(a.createdAt || 0).getTime();
      vb = new Date(b.createdAt || 0).getTime();
    }
    if (va < vb) return sort.dir === 'asc' ? -1 : 1;
    if (va > vb) return sort.dir === 'asc' ?  1 : -1;
    return 0;
  });

  return (
    <div className="list-view">
      {/* Toolbar */}
      <div className="list-toolbar">
        <div className="list-search">
          <span className="material-icons">search</span>
          <input
            placeholder="Search company, role, location…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="list-search__input"
          />
          {filter && (
            <button className="list-search__clear" onClick={() => setFilter('')}>
              <span className="material-icons">close</span>
            </button>
          )}
        </div>
        <select
          className="list-stage-filter"
          value={stageF}
          onChange={e => setStageF(e.target.value)}
        >
          <option value="">All stages</option>
          {Object.entries(STAGE_META).map(([v, m]) => (
            <option key={v} value={v}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="apps-table-card card">
        {loading ? (
          <div className="empty-state">
            <div className="spinner" />
          </div>
        ) : rows.length === 0 ? (
          <div className="empty-state">
            <span className="material-icons">search_off</span>
            <h3>No results</h3>
            <p>Try changing your search or filter.</p>
          </div>
        ) : (
          <div className="apps-table-wrap">
            <table className="apps-table">
              <thead>
                <tr>
                  {COLS.map(col => (
                    <th key={col.key} onClick={() => toggleSort(col.key)} className="apps-table__th--sortable">
                      {col.label} <SortIcon col={col.key} />
                    </th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map(app => {
                  const stage = STAGE_META[app.status] ?? STAGE_META.saved;
                  const prio  = PRIORITY_META[app.priority] ?? PRIORITY_META.medium;
                  return (
                    <tr key={app._id} className="apps-table__row">
                      <td>
                        <div className="app-company">
                          <span className="app-company__name">{app.company}</span>
                          {app.url && (
                            <a href={app.url} target="_blank" rel="noopener noreferrer" className="app-company__link">
                              <span className="material-icons">open_in_new</span>
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="apps-table__role">{app.role}</td>
                      <td className="apps-table__loc">{app.location || '—'}</td>
                      <td>
                        <span
                          className="list-stage-badge"
                          style={{ background: stage.bg, color: stage.color }}
                        >
                          <span className="material-icons">{stage.icon}</span>
                          {stage.label}
                        </span>
                      </td>
                      <td>
                        <span className={`priority-badge ${prio.cls}`}>{prio.label}</span>
                      </td>
                      <td className="apps-table__date">{fmtDate(app.createdAt)}</td>
                      <td>
                        <div className="list-row-actions">
                          <button
                            className="list-row-btn"
                            onClick={() => onEdit(app)}
                            title="Edit"
                          >
                            <span className="material-icons">edit</span>
                          </button>
                          <button
                            className="list-row-btn list-row-btn--danger"
                            onClick={() => onDelete(app._id)}
                            title="Delete"
                          >
                            <span className="material-icons">delete_outline</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
