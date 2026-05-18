import { useState, useEffect } from 'react';

/**
 * useJobs
 * ─────────────────────────────────────────────────────────────
 * Fetches remote job listings from the Remotive public API.
 * Returns: { jobs, loading, error, source, refetch }
 */

const REMOTIVE_URL = 'https://remotive.com/api/remote-jobs?category=software-dev&limit=50';

// ── Remotive normaliser ───────────────────────────────────────

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

// ── Hook ──────────────────────────────────────────────────────

export function useJobs() {
  const [jobs,     setJobs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    const ctrl    = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 12_000);

    setLoading(true);
    setError(null);

    fetch(REMOTIVE_URL, { signal: ctrl.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
        return res.json();
      })
      .then(({ jobs: list = [] }) => {
        setJobs(list.map(normaliseRemotive));
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to load jobs');
          setLoading(false);
        }
      })
      .finally(() => clearTimeout(timeout));

    return () => { ctrl.abort(); clearTimeout(timeout); };
  }, [fetchKey]);

  const refetch = () => setFetchKey((k) => k + 1);

  return { jobs, loading, error, source: 'remotive', refetch };
}
