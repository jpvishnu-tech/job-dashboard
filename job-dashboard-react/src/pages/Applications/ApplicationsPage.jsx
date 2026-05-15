import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/applications';
import PipelineView from './views/PipelineView';
import ListView     from './views/ListView';
import AnalyticsView from './views/AnalyticsView';
import InterviewView from './views/InterviewView';
import ApplicationModal from './ApplicationModal';
import './ApplicationsPage.css';

const TABS = [
  { id: 'pipeline',  label: 'Pipeline',   icon: 'view_kanban'   },
  { id: 'list',      label: 'List',       icon: 'list'          },
  { id: 'analytics', label: 'Analytics',  icon: 'analytics'     },
  { id: 'interviews',label: 'Interviews', icon: 'event'         },
];

export default function ApplicationsPage() {
  const { user }    = useAuth();
  const [tab, setTab]                     = useState('pipeline');
  const [applications, setApplications]   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [modalOpen, setModalOpen]         = useState(false);
  const [editTarget, setEditTarget]       = useState(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.listApplications(() => user.getIdToken(), { limit: 200 });
      setApplications(res.apps ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function handleSave(formData) {
    if (editTarget) {
      const res = await api.updateApplication(() => user.getIdToken(), editTarget._id, formData);
      setApplications(prev => prev.map(a => a._id === editTarget._id ? res.data : a));
    } else {
      const res = await api.createApplication(() => user.getIdToken(), formData);
      setApplications(prev => [res.data, ...prev]);
    }
    setEditTarget(null);
  }

  async function handleStatusChange(appId, newStatus) {
    try {
      const res = await api.updateStatus(() => user.getIdToken(), appId, newStatus);
      setApplications(prev => prev.map(a => a._id === appId ? res.data : a));
    } catch (err) {
      console.error('[status]', err);
    }
  }

  async function handleDelete(appId) {
    if (!confirm('Delete this application? This cannot be undone.')) return;
    await api.deleteApplication(() => user.getIdToken(), appId);
    setApplications(prev => prev.filter(a => a._id !== appId));
  }

  function handleEdit(app) {
    setEditTarget(app);
    setModalOpen(true);
  }

  function handleApplicationUpdate(updatedApp) {
    setApplications(prev => prev.map(a => a._id === updatedApp._id ? updatedApp : a));
  }

  const interviewCount = applications.reduce((n, a) => n + (a.interviews?.filter(i => i.status === 'scheduled' && new Date(i.scheduledAt) >= new Date()).length || 0), 0);

  return (
    <div className="apps-page">
      {/* Page header */}
      <div className="apps-page__header">
        <div>
          <h2 className="apps-page__title">
            Applications
            <span className="apps-badge">{applications.length}</span>
          </h2>
          <p className="apps-page__sub">Track every application through your personal hiring pipeline</p>
        </div>
        <button
          className="btn btn--primary"
          onClick={() => { setEditTarget(null); setModalOpen(true); }}
        >
          <span className="material-icons">add</span>
          Add Application
        </button>
      </div>

      {error && (
        <div className="card apps-error">
          <span className="material-icons">error_outline</span>
          <p>{error}</p>
          <button className="btn btn--secondary btn--sm" onClick={load}>Retry</button>
        </div>
      )}

      {/* Tabs */}
      <div className="apps-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`apps-tab ${tab === t.id ? 'apps-tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="material-icons">{t.icon}</span>
            {t.label}
            {t.id === 'interviews' && interviewCount > 0 && (
              <span className="apps-tab__badge">{interviewCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Views */}
      {tab === 'pipeline' && (
        <PipelineView
          applications={applications}
          loading={loading}
          onStatusChange={handleStatusChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {tab === 'list' && (
        <ListView
          applications={applications}
          loading={loading}
          onStatusChange={handleStatusChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {tab === 'analytics' && <AnalyticsView />}

      {tab === 'interviews' && (
        <InterviewView
          applications={applications}
          onApplicationUpdate={handleApplicationUpdate}
        />
      )}

      {/* Add / Edit modal */}
      <ApplicationModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        onSave={handleSave}
        initial={editTarget}
      />
    </div>
  );
}
