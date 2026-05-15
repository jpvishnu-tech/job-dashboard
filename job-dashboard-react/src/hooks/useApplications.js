import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/applications';

export function useApplications(_uid) {
  const { user }                         = useAuth();
  const [applications, setApplications]  = useState([]);
  const [loading, setLoading]            = useState(true);
  const [error, setError]                = useState(null);

  const load = useCallback(async () => {
    if (!user) { setApplications([]); setLoading(false); return; }
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

  async function addApplication(data) {
    if (!user) return;
    const res = await api.createApplication(() => user.getIdToken(), {
      ...data,
      status: data.status || 'saved',
    });
    setApplications(prev => [res.data, ...prev]);
    return res.data;
  }

  async function updateStatus(appId, status) {
    if (!user) return;
    await api.updateStatus(() => user.getIdToken(), appId, status);
    setApplications(prev =>
      prev.map(a => a._id === appId ? { ...a, status } : a)
    );
  }

  async function deleteApplication(appId) {
    if (!user) return;
    await api.deleteApplication(() => user.getIdToken(), appId);
    setApplications(prev => prev.filter(a => a._id !== appId));
  }

  return { applications, loading, error, addApplication, updateStatus, deleteApplication, refresh: load };
}
