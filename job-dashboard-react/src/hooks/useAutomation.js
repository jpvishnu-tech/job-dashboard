import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/automation';

export function useAutomation() {
  const { user } = useAuth();
  const getToken = useCallback(() => user?.getIdToken(), [user]);

  const [tasks,     setTasks]     = useState([]);
  const [reminders, setReminders] = useState([]);
  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState({ tasks: true, reminders: true, stats: true });
  const [error,     setError]     = useState({ tasks: null, reminders: null });

  // ── Loaders ────────────────────────────────────────────────────

  const loadTasks = useCallback(async () => {
    if (!user) return;
    setLoading(p => ({ ...p, tasks: true }));
    try {
      const res = await api.listTasks(getToken);
      setTasks(res.tasks ?? []);
      setError(p => ({ ...p, tasks: null }));
    } catch (err) {
      setError(p => ({ ...p, tasks: err.message }));
    } finally {
      setLoading(p => ({ ...p, tasks: false }));
    }
  }, [user, getToken]);

  const loadReminders = useCallback(async () => {
    if (!user) return;
    setLoading(p => ({ ...p, reminders: true }));
    try {
      const res = await api.listReminders(getToken);
      setReminders(res.reminders ?? []);
      setError(p => ({ ...p, reminders: null }));
    } catch (err) {
      setError(p => ({ ...p, reminders: err.message }));
    } finally {
      setLoading(p => ({ ...p, reminders: false }));
    }
  }, [user, getToken]);

  const loadStats = useCallback(async () => {
    if (!user) return;
    setLoading(p => ({ ...p, stats: true }));
    try {
      const res = await api.getDashboard(getToken);
      setStats(res.data ?? null);
    } catch {
      // non-critical
    } finally {
      setLoading(p => ({ ...p, stats: false }));
    }
  }, [user, getToken]);

  useEffect(() => {
    loadTasks();
    loadReminders();
    loadStats();
  }, [loadTasks, loadReminders, loadStats]);

  // ── Task actions ────────────────────────────────────────────────

  const completeTask = useCallback(async (id) => {
    const res = await api.updateTask(getToken, id, { status: 'completed' });
    setTasks(prev => prev.map(t => t._id === id ? res.data : t));
  }, [getToken]);

  const dismissTask = useCallback(async (id) => {
    const res = await api.updateTask(getToken, id, { status: 'dismissed' });
    setTasks(prev => prev.map(t => t._id === id ? res.data : t));
  }, [getToken]);

  const addTask = useCallback(async (data) => {
    const res = await api.createTask(getToken, data);
    setTasks(prev => [res.data, ...prev]);
    return res.data;
  }, [getToken]);

  const runGenerateTasks = useCallback(async () => {
    const res = await api.generateTasks(getToken);
    setTasks(res.tasks ?? []);
    await loadStats();
    return res;
  }, [getToken, loadStats]);

  // ── Reminder actions ────────────────────────────────────────────

  const addReminder = useCallback(async (data) => {
    const res = await api.createReminder(getToken, data);
    setReminders(prev => [res.data, ...prev].sort(
      (a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt),
    ));
    return res.data;
  }, [getToken]);

  const dismissReminder = useCallback(async (id) => {
    const res = await api.updateReminder(getToken, id, { status: 'dismissed' });
    setReminders(prev => prev.filter(r => r._id !== id));
    return res.data;
  }, [getToken]);

  const removeReminder = useCallback(async (id) => {
    await api.deleteReminder(getToken, id);
    setReminders(prev => prev.filter(r => r._id !== id));
  }, [getToken]);

  // ── Derived counts ──────────────────────────────────────────────

  const pendingTaskCount    = tasks.filter(t => t.status === 'pending').length;
  const highPriorityCount   = tasks.filter(t => t.status === 'pending' && t.priority === 'high').length;
  const pendingReminderCount = reminders.filter(r => r.status === 'pending').length;

  return {
    tasks, reminders, stats, loading, error,
    pendingTaskCount, highPriorityCount, pendingReminderCount,
    // Actions
    completeTask, dismissTask, addTask, runGenerateTasks,
    addReminder, dismissReminder, removeReminder,
    // Refresh
    refresh: { tasks: loadTasks, reminders: loadReminders, stats: loadStats },
  };
}
