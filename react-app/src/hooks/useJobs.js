import { useState, useEffect } from 'react';

/**
 * useJobs
 * ─────────────────────────────────────────────────────────────
 * Fetches job listings with a two-source strategy:
 *
 *   1. Backend  GET /api/jobs — jobs stored in MongoDB (via Vite proxy)
 *   2. Remotive public API   — fallback when the backend has no jobs yet
 *
 * The backend is tried first.  If it returns an empty array or errors,
 * the hook automatically falls back to Remotive so the dashboard is
 * never blank.  The `source` return value ('backend' | 'remotive') lets
 * the UI show a "Live" indicator when using real-time external data.
 *
 * Returns: { jobs, loading, error, source, refetch }
 */

const BACKEND_URL  = '/api/jobs?limit=50&sort=newest';
const REMOTIVE_URL = 'https://remotive.com/api/remote-jobs?category=software-dev&limit=50';

// ── Backend normaliser ────────────────────────────────────────────────────────

const BACKEND_TYPE_MAP = {
  'full-time':  { label: 'Full-time', cls: 'type-badge--full'   },
  'part-time':  { label: 'Part-time', cls: 'type-badge--hybrid' },
  'contract':   { label: 'Contract',  cls: 'type-badge--onsite' },
  'internship': { label: 'Internship',cls: 'type-badge--hybrid' },
};

function normaliseBackend(job) {
  const type = BACKEND_TYPE_MAP[job.type] ?? { label: 'Remote', cls: 'type-badge--remote' };
  return {
    id:       job._id,
    company:  job.company  || 'Unknown',
    logoUrl:  job.companyLogo ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=6366f1&color=fff&size=36&bold=true`,
    role:     job.title    || 'Open Position',
    dept:     job.department || 'Engineering',
    location: job.location || 'Remote',
    salary:   job.salary   || '',
    salaryN:  job.salaryMin || 0,
    type,
    url:      job.url || '#',
  };
}

// ── Remotive normaliser ───────────────────────────────────────────────────────

const TYPE_MAP = {
  full_time: { label: 'Full-time', cls: 'type-badge--full'   },
  contract:  { label: 'Contract',  cls: 'type-badge--onsite' },
  part_time: { label: 'Part-time', cls: 'type-badge--hybrid' },
  freelance: { label: 'Freelance', cls: 'type-badge--hybrid' },
};

const DEPT_MAP = {
  'software-dev':     'Engineering',
  design:             'Design',
  marketing:          'Marketing',
  'customer-support': 'Support',
  devops:             'Infrastructure',
  product:            'Product',
  data:               'Data',
  sales:              'Sales',
  writing:            'Content',
};

function normaliseRemotive(raw) {
  const type    = TYPE_MAP[raw.job_type] ?? { label: 'Remote', cls: 'type-badge--remote' };
  const salary  = raw.salary?.trim() ?? '';
  const salaryN = salary ? parseFloat(salary.replace(/[^\d.]/g, '')) || 0 : 0;
  const logoUrl =
    raw.company_logo_url?.trim() ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(raw.company_name)}&background=6366f1&color=fff&size=36&bold=true`;

  return {
    id:       raw.id,
    company:  raw.company_name || 'Unknown',
    logoUrl,
    role:     raw.title || 'Open Position',
    dept:     DEPT_MAP[raw.category] ?? 'Engineering',
    location: raw.candidate_required_location || 'Remote',
    salary,
    salaryN,
    type,
    url:      raw.url || '#',
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useJobs() {
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [source,  setSource]  = useState(null); // 'backend' | 'remotive'
  const [fetchKey,setFetchKey]= useState(0);

  useEffect(() => {
    const ctrl    = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 12_000);

    setLoading(true);
    setError(null);

    const signal = ctrl.signal;

    // ── Step 1: try the backend ────────────────────────────────
    fetch(BACKEND_URL, { signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Backend ${res.status}`);
        return res.json();
      })
      .then(({ data = [] }) => {
        if (data.length > 0) {
          // Backend has jobs — use them
          setJobs(data.map(normaliseBackend));
          setSource('backend');
          setLoading(false);
          return;
        }

        // Backend is empty — fall through to Remotive
        return fetchRemotive(signal);
      })
      .catch(() => {
        // Backend unreachable or errored — fall back gracefully
        if (!signal.aborted) return fetchRemotive(signal);
      })
      .finally(() => clearTimeout(timeout));

    // ── Step 2: Remotive fallback ──────────────────────────────
    async function fetchRemotive(sig) {
      try {
        const res = await fetch(REMOTIVE_URL, { signal: sig });
        if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
        const { jobs: list = [] } = await res.json();
        setJobs(list.map(normaliseRemotive));
        setSource('remotive');
        setLoading(false);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to load jobs');
          setLoading(false);
        }
      }
    }

    return () => { ctrl.abort(); clearTimeout(timeout); };
  }, [fetchKey]);

  const refetch = () => setFetchKey((k) => k + 1);

  return { jobs, loading, error, source, refetch };
}
