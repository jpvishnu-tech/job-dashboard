import { useState, useEffect, useCallback, useRef } from 'react';
import { listJobs } from '../services/jobs';

const DEFAULT_FILTERS = {
  search:          '',
  location:        '',
  type:            '',
  remote:          false,
  experienceLevel: '',
  minSalary:       '',
  maxSalary:       '',
  source:          '',
  sort:            'newest',
  page:            1,
  limit:           12,
};

export function useJobs(initial = {}) {
  const [jobs, setJobs]           = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [filters, setFilters]     = useState({ ...DEFAULT_FILTERS, ...initial });

  // Debounce search input so we don't fire on every keystroke
  const debounceRef = useRef(null);

  const fetchJobs = useCallback(async (f) => {
    setLoading(true);
    setError(null);
    try {
      const result = await listJobs(f);
      setJobs(result.data ?? []);
      setPagination(result.pagination ?? null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchJobs(filters), 300);
    return () => clearTimeout(debounceRef.current);
  }, [fetchJobs, filters]);

  /** Update one or more filter keys; resets page to 1. */
  function updateFilters(updates) {
    setFilters(prev => ({ ...prev, ...updates, page: 1 }));
  }

  /** Jump to a specific page without resetting other filters. */
  function setPage(page) {
    setFilters(prev => ({ ...prev, page }));
  }

  /** Reset all filters to defaults. */
  function resetFilters() {
    setFilters({ ...DEFAULT_FILTERS });
  }

  return {
    jobs,
    pagination,
    loading,
    error,
    filters,
    updateFilters,
    setPage,
    resetFilters,
    refetch: () => fetchJobs(filters),
  };
}

// ── Saved jobs (localStorage) ─────────────────────────────────────────────

export function useSavedJobs() {
  const [savedIds, setSavedIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('savedJobs') || '[]'));
    } catch { return new Set(); }
  });

  function toggleSave(jobId) {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else                  next.add(jobId);
      localStorage.setItem('savedJobs', JSON.stringify([...next]));
      return next;
    });
  }

  function isSaved(jobId) {
    return savedIds.has(jobId);
  }

  return { savedIds, toggleSave, isSaved, count: savedIds.size };
}
