import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import './DashboardCards.css';

/**
 * useCountUp
 * ─────────────────────────────────────────────────────────────
 * Custom hook that animates a number from 0 to `target` using
 * requestAnimationFrame and an IntersectionObserver.
 *
 * The animation only starts when the element first scrolls into view,
 * matching the original vanilla JS behaviour.  Once played, it doesn't
 * replay (hasAnimated ref prevents double-firing).
 *
 * Returns [animatedValue, ref] — attach ref to the DOM element.
 */
function useCountUp(target, duration = 1200) {
  const [value, setValue]   = useState(0);
  const ref                 = useRef(null);
  const hasAnimated         = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reset when the target changes (e.g. Firestore data arrives later)
    hasAnimated.current = false;
    setValue(0);

    let rafId;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasAnimated.current) return;
        hasAnimated.current = true;
        observer.disconnect();

        let startTime;
        const step = (timestamp) => {
          if (!startTime) startTime = timestamp;
          const progress = Math.min((timestamp - startTime) / duration, 1);
          // Ease-out cubic — decelerates towards the end so it feels natural
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(Math.round(eased * target));
          if (progress < 1) rafId = requestAnimationFrame(step);
        };

        rafId = requestAnimationFrame(step);
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [target, duration]);

  return [value, ref];
}

/**
 * useProgressBar
 * ─────────────────────────────────────────────────────────────
 * Returns a CSS width string that starts at '0%' and transitions
 * to the target percentage after a short delay.  The delay ensures
 * the CSS transition actually plays (setting width=0 then immediately
 * setting the target in the same paint frame would skip the animation).
 */
function useProgressBar(pct) {
  const [width, setWidth] = useState('0%');
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 150);
    return () => clearTimeout(t);
  }, [pct]);
  return width;
}

/* ── StatCard ─────────────────────────────────────────────────────────────── */

/**
 * StatCard
 * ─────────────────────────────────────────────────────────────
 * Renders one KPI tile.
 *
 * Props:
 *   colorClass  – BEM modifier, e.g. 'stat-card--indigo'
 *   icon        – Material icon name
 *   target      – final number to count up to
 *   label       – metric name, e.g. 'Jobs Applied'
 *   meta        – context text shown below the bar, e.g. '+5 from last month'
 *   barPct      – string percentage for the progress bar, e.g. '62%'
 *   badgeDir    – 'up' or 'down' (controls arrow direction + colour)
 *   badgeVal    – text inside the trend badge, e.g. '12%'
 */
function StatCard({ colorClass, icon, target, label, meta, barPct, badgeDir, badgeVal }) {
  const [count, countRef] = useCountUp(target);
  const barWidth          = useProgressBar(barPct);

  return (
    <div className={`stat-card ${colorClass}`}>
      {/* Top row: icon + trend badge */}
      <div className="stat-card__header">
        <div className="stat-card__icon-wrap">
          <span className="material-icons">{icon}</span>
        </div>
        <span className={`stat-card__badge stat-card__badge--${badgeDir}`}>
          <span className="material-icons">
            {badgeDir === 'up' ? 'arrow_upward' : 'arrow_downward'}
          </span>
          {badgeVal}
        </span>
      </div>

      {/* Middle row: animated count + label */}
      <div className="stat-card__body">
        <span className="stat-card__value" ref={countRef}>{count}</span>
        <span className="stat-card__label">{label}</span>
      </div>

      {/* Bottom row: meta text + animated progress bar */}
      <div className="stat-card__footer">
        <span className="stat-card__meta">{meta}</span>
        <div className="stat-card__bar-wrap">
          {/*
            Width is driven to barWidth by useProgressBar.  The CSS transition
            on .stat-card__bar creates the smooth fill animation.
          */}
          <div className="stat-card__bar" style={{ width: barWidth }} />
        </div>
      </div>
    </div>
  );
}

/* ── DashboardCards ───────────────────────────────────────────────────────── */

/**
 * DashboardCards
 * ─────────────────────────────────────────────────────────────
 * Reads the user's Firestore applications from AuthContext and maps
 * them to four KPI tiles:
 *
 *   Jobs Applied  – total applications
 *   Interviews    – applications with status 'interview'
 *   Pending       – applications with status 'pending' (awaiting response)
 *   Rejected      – applications with status 'rejected'
 *
 * When Firebase is not configured (placeholder mode), the tiles display
 * hard-coded demo values so the dashboard still looks complete.
 */
export default function DashboardCards() {
  const { applications } = useAuth();

  // Derive counts from Firestore data; fall back to demo numbers when empty.
  const total     = applications.length;
  const interview = applications.filter((a) => a.status === 'interview').length;
  const pending   = applications.filter((a) => a.status === 'pending').length;
  const rejected  = applications.filter((a) => a.status === 'rejected').length;

  // Use real data when applications exist, otherwise show demo numbers
  const useDemoData = total === 0;

  const CARDS = [
    {
      colorClass: 'stat-card--indigo',
      icon:       'send',
      target:     useDemoData ? 48     : total,
      label:      'Jobs Applied',
      meta:       useDemoData ? '+5 from last month' : `${total} total applications`,
      barPct:     useDemoData ? '62%'  : `${Math.min(100, total * 2)}%`,
      badgeDir:   'up',
      badgeVal:   '12%',
    },
    {
      colorClass: 'stat-card--green',
      icon:       'event_available',
      target:     useDemoData ? 6      : interview,
      label:      'Interviews',
      meta:       useDemoData ? '12.5% interview rate' : `${total ? Math.round((interview / total) * 100) : 0}% interview rate`,
      barPct:     useDemoData ? '13%'  : `${total ? Math.round((interview / total) * 100) : 0}%`,
      badgeDir:   'up',
      badgeVal:   '8%',
    },
    {
      colorClass: 'stat-card--amber',
      icon:       'hourglass_top',
      target:     useDemoData ? 14     : pending,
      label:      'Pending',
      meta:       useDemoData ? '29% awaiting response' : `${total ? Math.round((pending / total) * 100) : 0}% awaiting response`,
      barPct:     useDemoData ? '29%'  : `${total ? Math.round((pending / total) * 100) : 0}%`,
      badgeDir:   'up',
      badgeVal:   '5%',
    },
    {
      colorClass: 'stat-card--red',
      icon:       'cancel',
      target:     useDemoData ? 9      : rejected,
      label:      'Rejected',
      meta:       useDemoData ? '19% rejection rate' : `${total ? Math.round((rejected / total) * 100) : 0}% rejection rate`,
      barPct:     useDemoData ? '19%'  : `${total ? Math.round((rejected / total) * 100) : 0}%`,
      badgeDir:   'down',
      badgeVal:   '3%',
    },
  ];

  return (
    <section className="stats-grid" aria-label="Application statistics">
      {CARDS.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </section>
  );
}
