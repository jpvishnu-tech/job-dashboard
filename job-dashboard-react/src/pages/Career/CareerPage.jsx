import { useState } from 'react';
import RoadmapPanel      from './panels/RoadmapPanel';
import SkillsGapPanel    from './panels/SkillsGapPanel';
import SalaryPanel       from './panels/SalaryPanel';
import InterviewPrepPanel from './panels/InterviewPrepPanel';
import './CareerPage.css';

const TABS = [
  { key: 'roadmap',    icon: 'explore',            label: 'Roadmap'       },
  { key: 'skills',     icon: 'psychology',          label: 'Skills Gap'    },
  { key: 'salary',     icon: 'payments',            label: 'Salary'        },
  { key: 'interview',  icon: 'record_voice_over',   label: 'Interview Prep' },
];

export default function CareerPage() {
  const [tab, setTab] = useState('roadmap');

  return (
    <div className="career-page">
      {/* Page header */}
      <div className="career-page__header">
        <div className="career-page__header-inner">
          <span className="material-icons career-page__icon">psychology_alt</span>
          <div>
            <h1 className="career-page__title">AI Career Assistant</h1>
            <p className="career-page__sub">
              Your personalised career operating system — roadmaps, skill gaps, salary intelligence, and interview prep
            </p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="career-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`career-tab${tab === t.key ? ' career-tab--active' : ''}`}
            onClick={() => setTab(t.key)}
            type="button"
          >
            <span className="material-icons career-tab__icon">{t.icon}</span>
            <span className="career-tab__label">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="career-panel-wrap">
        {tab === 'roadmap'   && <RoadmapPanel />}
        {tab === 'skills'    && <SkillsGapPanel />}
        {tab === 'salary'    && <SalaryPanel />}
        {tab === 'interview' && <InterviewPrepPanel />}
      </div>
    </div>
  );
}
