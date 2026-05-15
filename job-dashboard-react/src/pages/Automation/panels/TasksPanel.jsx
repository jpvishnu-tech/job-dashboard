import { useState } from 'react';

const TYPE_META = {
  apply_to_job:          { icon: 'send',           label: 'Apply'          },
  follow_up_application: { icon: 'reply',          label: 'Follow Up'      },
  prepare_interview:     { icon: 'school',         label: 'Prep Interview' },
  research_company:      { icon: 'search',         label: 'Research'       },
  update_resume:         { icon: 'description',    label: 'Update Resume'  },
  reach_out_recruiter:   { icon: 'person_pin',     label: 'Reach Out'      },
  review_offer:          { icon: 'celebration',    label: 'Review Offer'   },
  improve_profile:       { icon: 'manage_accounts',label: 'Profile'        },
  add_skills:            { icon: 'add_task',       label: 'Add Skills'     },
  practice_interview:    { icon: 'record_voice_over',label: 'Practice'    },
  custom:                { icon: 'checklist',      label: 'Task'           },
};

const PRIORITY_META = {
  high:   { label: 'High',   cls: 'task-priority--high'   },
  medium: { label: 'Medium', cls: 'task-priority--medium' },
  low:    { label: 'Low',    cls: 'task-priority--low'    },
};

const HEALTH_META = {
  excellent:       { label: 'Excellent',       color: '#10b981', icon: 'trending_up'     },
  good:            { label: 'Good',            color: '#3b82f6', icon: 'thumb_up'        },
  needs_attention: { label: 'Needs Attention', color: '#f59e0b', icon: 'warning'         },
  critical:        { label: 'Critical',        color: '#ef4444', icon: 'priority_high'   },
};

function fmtDue(date) {
  if (!date) return null;
  const d    = new Date(date);
  const days = Math.ceil((d - Date.now()) / 86400000);
  if (days < 0)  return { label: `${Math.abs(days)}d overdue`, cls: 'task-due--overdue' };
  if (days === 0) return { label: 'Due today',                   cls: 'task-due--today'   };
  if (days === 1) return { label: 'Due tomorrow',                cls: 'task-due--soon'    };
  return { label: `Due in ${days}d`, cls: 'task-due--ok' };
}

function TaskCard({ task, onComplete, onDismiss }) {
  const type     = TYPE_META[task.type]     || TYPE_META.custom;
  const priority = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  const due      = fmtDue(task.dueDate);

  return (
    <div className={`task-card card ${task.priority === 'high' ? 'task-card--high' : ''}`}>
      <div className="task-card__header">
        <div className="task-card__type">
          <span className="material-icons task-card__type-icon">{type.icon}</span>
          <span className="task-card__type-label">{type.label}</span>
        </div>
        <div className="task-card__badges">
          {task.aiGenerated && (
            <span className="task-ai-badge">
              <span className="material-icons">auto_awesome</span> AI
            </span>
          )}
          <span className={`task-priority ${priority.cls}`}>{priority.label}</span>
        </div>
      </div>

      <p className="task-card__title">{task.title}</p>
      {task.description && <p className="task-card__desc">{task.description}</p>}

      <div className="task-card__footer">
        {due && <span className={`task-due ${due.cls}`}>{due.label}</span>}
        <div className="task-card__actions">
          <button
            className="btn btn--primary btn--sm"
            onClick={() => onComplete(task._id)}
            title="Mark complete"
          >
            <span className="material-icons">check</span>
            Done
          </button>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => onDismiss(task._id)}
            title="Dismiss"
          >
            <span className="material-icons">close</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TasksPanel({
  tasks, loading, error,
  onComplete, onDismiss, onGenerate, onAdd,
}) {
  const [generating, setGenerating]   = useState(false);
  const [genResult,  setGenResult]    = useState(null);
  const [filterPrio, setFilterPrio]   = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask]         = useState({ title: '', description: '', priority: 'medium', type: 'custom' });
  const [adding, setAdding]           = useState(false);

  const activeTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const filtered    = filterPrio
    ? activeTasks.filter(t => t.priority === filterPrio)
    : activeTasks;

  const highCount = activeTasks.filter(t => t.priority === 'high').length;

  async function handleGenerate() {
    setGenerating(true);
    setGenResult(null);
    try {
      const res = await onGenerate();
      setGenResult({ health: res.pipelineHealth, note: res.healthNote, count: res.generated });
    } catch (err) {
      setGenResult({ error: err.message });
    } finally {
      setGenerating(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    setAdding(true);
    try {
      await onAdd(newTask);
      setNewTask({ title: '', description: '', priority: 'medium', type: 'custom' });
      setShowAddForm(false);
    } finally {
      setAdding(false);
    }
  }

  const health = genResult?.health ? HEALTH_META[genResult.health] || HEALTH_META.good : null;

  return (
    <div className="tasks-panel">
      {/* Toolbar */}
      <div className="tasks-toolbar">
        <div className="tasks-toolbar__left">
          <span className="tasks-count">
            {activeTasks.length} task{activeTasks.length !== 1 ? 's' : ''}
            {highCount > 0 && (
              <span className="tasks-high-badge">{highCount} high</span>
            )}
          </span>
          <select
            className="form-control tasks-filter"
            value={filterPrio}
            onChange={e => setFilterPrio(e.target.value)}
          >
            <option value="">All priorities</option>
            <option value="high">High priority</option>
            <option value="medium">Medium priority</option>
            <option value="low">Low priority</option>
          </select>
        </div>
        <div className="tasks-toolbar__right">
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => setShowAddForm(p => !p)}
          >
            <span className="material-icons">add</span>
            Add Task
          </button>
          <button
            className="btn btn--primary btn--sm"
            onClick={handleGenerate}
            disabled={generating}
          >
            <span className="material-icons">auto_awesome</span>
            {generating ? 'Generating…' : 'AI Generate'}
          </button>
        </div>
      </div>

      {/* Pipeline health result */}
      {genResult && !genResult.error && health && (
        <div className="pipeline-health card" style={{ borderLeft: `3px solid ${health.color}` }}>
          <span className="material-icons" style={{ color: health.color }}>{health.icon}</span>
          <div>
            <strong style={{ color: health.color }}>Pipeline: {health.label}</strong>
            {genResult.note && <p className="pipeline-health__note">{genResult.note}</p>}
          </div>
          <span className="pipeline-health__badge">+{genResult.count} new tasks</span>
        </div>
      )}
      {genResult?.error && (
        <div className="task-error card">
          <span className="material-icons">error_outline</span>{genResult.error}
        </div>
      )}

      {/* Add task inline form */}
      {showAddForm && (
        <form className="add-task-form card" onSubmit={handleAdd}>
          <div className="modal-grid">
            <div className="form-group form-group--full">
              <label className="form-label">Task Title *</label>
              <input
                className="form-control"
                placeholder="What needs to be done?"
                value={newTask.title}
                onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                className="form-control"
                value={newTask.type}
                onChange={e => setNewTask(p => ({ ...p, type: e.target.value }))}
              >
                {Object.entries(TYPE_META).map(([v, m]) => (
                  <option key={v} value={v}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-control"
                value={newTask.priority}
                onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="form-group form-group--full">
              <label className="form-label">Description (optional)</label>
              <input
                className="form-control"
                placeholder="Brief description…"
                value={newTask.description}
                onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowAddForm(false)}>Cancel</button>
            <button type="submit" className="btn btn--primary btn--sm" disabled={adding}>
              {adding ? 'Adding…' : 'Add Task'}
            </button>
          </div>
        </form>
      )}

      {/* Task list */}
      {error && (
        <div className="card task-error">
          <span className="material-icons">error_outline</span>{error}
        </div>
      )}

      {loading ? (
        <div className="tasks-grid">
          {[1, 2, 3].map(i => <div key={i} className="task-card card auto-skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card auto-empty">
          <span className="material-icons">checklist</span>
          <h3>{activeTasks.length === 0 ? 'No tasks yet' : 'No tasks match the filter'}</h3>
          <p>
            {activeTasks.length === 0
              ? 'Click "AI Generate" to get personalised action items for your job search.'
              : 'Try a different priority filter.'}
          </p>
        </div>
      ) : (
        <div className="tasks-grid">
          {filtered.map(task => (
            <TaskCard
              key={task._id}
              task={task}
              onComplete={onComplete}
              onDismiss={onDismiss}
            />
          ))}
        </div>
      )}

      {/* Completed tasks count */}
      {tasks.filter(t => t.status === 'completed').length > 0 && (
        <p className="tasks-completed-note">
          <span className="material-icons">check_circle</span>
          {tasks.filter(t => t.status === 'completed').length} task{tasks.filter(t => t.status === 'completed').length !== 1 ? 's' : ''} completed
        </p>
      )}
    </div>
  );
}
