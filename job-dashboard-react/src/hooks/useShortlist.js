import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getShortlistedJobs,
  getRecommendations,
  getPriorityJobs,
  getRecommendationAnalytics,
} from '../services/shortlist';

// ── Full shortlist hook (for ShortlistPage) ───────────────────────────────

export function useShortlist(filters = {}) {
  const { user }            = useAuth();
  const [items, setItems]   = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError]         = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadCached = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [listRes, analyticsRes] = await Promise.all([
        getShortlistedJobs(() => user.getIdToken(), filters),
        getRecommendationAnalytics(() => user.getIdToken()),
      ]);
      setItems(listRes.data ?? []);
      setAnalytics(analyticsRes.data ?? null);
      if (listRes.data?.length) {
        setLastUpdated(listRes.data[0]?.computedAt ?? null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, JSON.stringify(filters)]);

  useEffect(() => { loadCached(); }, [loadCached]);

  async function generate(forceRefresh = false) {
    if (!user || generating) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await getRecommendations(() => user.getIdToken(), { refresh: forceRefresh });
      setItems(res.data ?? []);
      if (res.data?.length) setLastUpdated(res.data[0]?.computedAt ?? null);
      // Refresh analytics after generation
      const analyticsRes = await getRecommendationAnalytics(() => user.getIdToken());
      setAnalytics(analyticsRes.data ?? null);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  return { items, analytics, loading, generating, error, lastUpdated, generate, refresh: loadCached };
}

// ── Priority jobs hook (for Dashboard SmartShortlist widget) ──────────────

export function usePriorityJobs(limit = 5) {
  const { user }          = useAuth();
  const [jobs, setJobs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEmpty, setIsEmpty] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await getPriorityJobs(() => user.getIdToken(), limit);
      setJobs(res.data ?? []);
      setIsEmpty((res.data ?? []).length === 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, limit]);

  useEffect(() => { load(); }, [load]);

  return { jobs, loading, error, isEmpty, refresh: load };
}
