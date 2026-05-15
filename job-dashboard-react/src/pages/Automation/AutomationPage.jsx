import { useState } from 'react';
import { useAutomation } from '../../hooks/useAutomation';
import TasksPanel           from './panels/TasksPanel';
import RemindersPanel       from './panels/RemindersPanel';
import RecommendationsPanel from './panels/RecommendationsPanel';
import CoverLetterPanel     from './panels/CoverLetterPanel';
import './AutomationPage.css';

const TABS = [
  { id: 'tasks',       label: 'Smart Tasks',     icon: 'checklist'          },
  { id: 'reminders',   label: 'Reminders',        icon: 'notifications'      },
  { id: 'recommendations', label: 'Resume AI',    icon: 'auto_awesome'       },
  { id: 'cover-letter',label: 'Cover Letter',     icon: 'edit_note'          },
];

function StatBadge({ icon, value, label, color, bg }) {
  return (
    <div className="auto-stat-card card">
      <div className="auto-stat-card__icon" style={{ background: bg, color }}>
        <span className="material-icons">{icon}</span>
      </div>
      <div>
        <div className="auto-stat-card__value" style={{ color }}>{value}</div>
        <div className="auto-stat-card__label">{label}</div>
      </div>
    </div>
  );
}

export default function AutomationPage() {
  const [tab, setTab] = useState('tasks');

  const {
    tasks, reminders, stats, loading, error,
    pendingTaskCount, highPriorityCount, pendingReminderCount,
    completeTask, dismissTask, addTask, runGenerateTasks,
    addReminder, dismissReminder, removeReminder,
  } = useAutomation();

  return (
    <div className="auto-page">
      {/* Header */}
      <div className="auto-page__header">
        <div>
          <h2 className="auto-page__title">
            <span className="material-icons auto-page__title-icon">auto_awesome</span>
            Automation Hub
          </h2>
          <p className="auto-page__sub">AI-powered task queue, reminders, and career recommendations</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="auto-stats-row">
        <StatBadge
          icon="checklist"
          value={pendingTaskCount}
          label="Pending Tasks"
          color="#6366f1"
          bg="#eef2ff"
        />
        <StatBadge
          icon="priority_high"
          value={highPriorityCount}
          label="High Priority"
          color="#ef4444"
          bg="#fee2e2"
        />
        <StatBadge
          icon="notifications_active"
          value={pendingReminderCount}
          label="Due Reminders"
          color="#f59e0b"
          bg="#fef3c7"
        />
        <StatBadge
          icon="work_outline"
          value={stats?.pipeline?.active ?? '—'}
          label="Active Applications"
          color="#10b981"
          bg="#d1fae5"
        />
      </div>

      {/* Tabs */}
      <div className="auto-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`auto-tab ${tab === t.id ? 'auto-tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="material-icons">{t.icon}</span>
            {t.label}
            {t.id === 'tasks' && pendingTaskCount > 0 && (
              <span className="auto-tab__badge">{pendingTaskCount}</span>
            )}
            {t.id === 'reminders' && pendingReminderCount > 0 && (
              <span className="auto-tab__badge">{pendingReminderCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Panels */}
      {tab === 'tasks' && (
        <TasksPanel
          tasks={tasks}
          loading={loading.tasks}
          error={error.tasks}
          onComplete={completeTask}
          onDismiss={dismissTask}
          onGenerate={runGenerateTasks}
          onAdd={addTask}
        />
      )}

      {tab === 'reminders' && (
        <RemindersPanel
          reminders={reminders}
          loading={loading.reminders}
          error={error.reminders}
          onAdd={addReminder}
          onDismiss={dismissReminder}
          onDelete={removeReminder}
        />
      )}

      {tab === 'recommendations' && <RecommendationsPanel />}

      {tab === 'cover-letter' && <CoverLetterPanel />}
    </div>
  );
}
