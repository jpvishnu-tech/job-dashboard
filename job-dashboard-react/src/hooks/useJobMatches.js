import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRecommendedJobs, analyzeResumeProfile } from '../services/aiMatching';

export function useJobMatches() {
  const { user }              = useAuth();
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [profileMissing, setProfileMissing] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await getRecommendedJobs(() => user.getIdToken());
      setJobs(res.data ?? []);
      setProfileMissing(!!res.profileMissing);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function buildProfile() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      await analyzeResumeProfile(() => user.getIdToken());
      await load();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return { jobs, loading, error, profileMissing, refresh: load, buildProfile };
}
