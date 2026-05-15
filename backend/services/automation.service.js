import AutomationTask from '../models/AutomationTask.js';
import Reminder       from '../models/Reminder.js';
import Application    from '../models/Application.js';
import { createNotification } from './notification.service.js';

// ── Task CRUD ─────────────────────────────────────────────────────────────

export async function listTasks(userId, { status, priority, limit = 100 } = {}) {
  const filter = { user: userId };
  if (status)   filter.status   = status;
  if (priority) filter.priority = priority;

  return AutomationTask.find(filter)
    .sort({ priority: 1, dueDate: 1, createdAt: -1 })
    .limit(limit)
    .lean();
}

export async function createTask(userId, data) {
  return AutomationTask.create({ ...data, user: userId });
}

export async function updateTask(userId, taskId, updates) {
  const allowed = ['title', 'description', 'priority', 'status', 'dueDate',
                   'completedAt', 'dismissedAt', 'snoozedUntil', 'metadata'];
  const safe = {};
  for (const k of allowed) if (k in updates) safe[k] = updates[k];

  if (updates.status === 'completed' && !safe.completedAt) safe.completedAt = new Date();
  if (updates.status === 'dismissed' && !safe.dismissedAt) safe.dismissedAt = new Date();

  return AutomationTask.findOneAndUpdate(
    { _id: taskId, user: userId },
    { $set: safe },
    { new: true },
  );
}

export async function deleteTask(userId, taskId) {
  return AutomationTask.findOneAndDelete({ _id: taskId, user: userId });
}

// ── Rule-based task generation ────────────────────────────────────────────
// Generates tasks by inspecting the user's application pipeline.
// Returns an array of unsaved task objects — the caller decides whether to save them.

export async function generateRuleBasedTasks(userId) {
  const now  = new Date();
  const apps = await Application.find({
    user:   userId,
    status: { $nin: ['hired', 'rejected'] },
  }).select('company role status updatedAt appliedAt interviews').lean();

  // Collect titles of tasks that are already pending to avoid duplicates
  const existing = await AutomationTask.find({
    user:   userId,
    status: { $in: ['pending', 'in_progress'] },
  }).select('title').lean();
  const pendingTitles = new Set(existing.map(t => t.title));

  const tasks = [];

  for (const app of apps) {
    const label         = `${app.company} – ${app.role}`;
    const daysSinceUpd  = Math.floor((now - new Date(app.updatedAt)) / 86_400_000);
    const daysSinceApplied = app.appliedAt
      ? Math.floor((now - new Date(app.appliedAt)) / 86_400_000)
      : null;

    // Saved for 3+ days → apply
    if (app.status === 'saved' && daysSinceUpd >= 3) {
      const title = `Apply to ${label}`;
      if (!pendingTitles.has(title)) {
        tasks.push({
          type: 'apply_to_job', title, priority: 'high',
          description: `You saved this job ${daysSinceUpd} days ago. Don't miss the opportunity — apply before the deadline.`,
          relatedApplication: app._id,
          dueDate: new Date(now.getTime() + 2 * 86_400_000),
        });
        pendingTitles.add(title);
      }
    }

    // Applied 7+ days without follow-up
    if (app.status === 'applied' && daysSinceApplied !== null && daysSinceApplied >= 7) {
      const title = `Follow up with ${app.company}`;
      if (!pendingTitles.has(title)) {
        tasks.push({
          type: 'follow_up_application', title,
          priority: daysSinceApplied >= 14 ? 'high' : 'medium',
          description: `No response in ${daysSinceApplied} days. Send a polite, value-adding follow-up to stay visible.`,
          relatedApplication: app._id,
          dueDate: new Date(now.getTime() + 86_400_000),
        });
        pendingTitles.add(title);
      }
    }

    // Under review, no updates in 10+ days
    if (app.status === 'under_review' && daysSinceUpd >= 10) {
      const title = `Check status at ${app.company}`;
      if (!pendingTitles.has(title)) {
        tasks.push({
          type: 'reach_out_recruiter', title, priority: 'medium',
          description: `Your application has been under review for ${daysSinceUpd} days. Reach out to the recruiter for an update.`,
          relatedApplication: app._id,
          dueDate: new Date(now.getTime() + 2 * 86_400_000),
        });
        pendingTitles.add(title);
      }
    }

    // Interview scheduled in next 5 days → prepare
    if (app.status === 'interview_scheduled') {
      const upcoming = app.interviews?.find(
        i => i.status === 'scheduled' && new Date(i.scheduledAt) > now,
      );
      if (upcoming) {
        const daysUntil = Math.ceil((new Date(upcoming.scheduledAt) - now) / 86_400_000);
        if (daysUntil <= 5) {
          const title = `Prepare for ${label} interview`;
          if (!pendingTitles.has(title)) {
            tasks.push({
              type: 'prepare_interview', title,
              priority: daysUntil <= 2 ? 'high' : 'medium',
              description: `Interview in ${daysUntil} day${daysUntil === 1 ? '' : 's'}. Research the company, review your talking points, and prepare questions.`,
              relatedApplication: app._id,
              dueDate: new Date(new Date(upcoming.scheduledAt).getTime() - 86_400_000),
            });
            pendingTitles.add(title);
          }
        }
      }
    }

    // Offer received → review
    if (app.status === 'offer_received') {
      const title = `Evaluate offer from ${app.company}`;
      if (!pendingTitles.has(title)) {
        tasks.push({
          type: 'review_offer', title, priority: 'high',
          description: `You have an offer from ${app.company}. Compare compensation, benefits, growth opportunities, and culture fit.`,
          relatedApplication: app._id,
          dueDate: new Date(now.getTime() + 3 * 86_400_000),
        });
        pendingTitles.add(title);
      }
    }
  }

  return tasks;
}

// Save a batch of generated task objects to the DB
export async function saveGeneratedTasks(userId, taskObjects) {
  if (!taskObjects.length) return [];
  const docs = taskObjects.map(t => ({ ...t, user: userId, aiGenerated: true }));
  return AutomationTask.insertMany(docs, { ordered: false }).catch(() => []);
}

// ── Reminder CRUD ─────────────────────────────────────────────────────────

export async function listReminders(userId, { status, limit = 100 } = {}) {
  const filter = { user: userId };
  if (status) filter.status = Array.isArray(status) ? { $in: status } : status;

  return Reminder.find(filter)
    .sort({ scheduledAt: 1 })
    .limit(limit)
    .lean();
}

export async function createReminder(userId, data) {
  return Reminder.create({ ...data, user: userId });
}

export async function updateReminder(userId, reminderId, updates) {
  const allowed = ['title', 'message', 'scheduledAt', 'status', 'snoozedUntil', 'dismissedAt'];
  const safe = {};
  for (const k of allowed) if (k in updates) safe[k] = updates[k];

  if (updates.status === 'dismissed' && !safe.dismissedAt) safe.dismissedAt = new Date();

  return Reminder.findOneAndUpdate(
    { _id: reminderId, user: userId },
    { $set: safe },
    { new: true },
  );
}

export async function deleteReminder(userId, reminderId) {
  return Reminder.findOneAndDelete({ _id: reminderId, user: userId });
}

// ── Scheduler: process due reminders ─────────────────────────────────────
// Called by reminderScheduler.service.js every 5 minutes.

export async function processDueReminders() {
  const now  = new Date();
  const snoozedFilter = { $or: [{ snoozedUntil: null }, { snoozedUntil: { $lte: now } }] };

  const due = await Reminder.find({
    status:      'pending',
    scheduledAt: { $lte: now },
    notificationSent: false,
    ...snoozedFilter,
  }).limit(50);

  const results = { processed: 0, failed: 0 };

  for (const reminder of due) {
    try {
      await createNotification(String(reminder.user), {
        type:    'reminder_due',
        title:   reminder.title,
        message: reminder.message || `Your reminder is due now.`,
        data:    { reminderId: reminder._id, reminderType: reminder.type },
      });

      await Reminder.findByIdAndUpdate(reminder._id, {
        $set: { status: 'sent', sentAt: now, notificationSent: true },
      });

      results.processed++;
    } catch {
      results.failed++;
    }
  }

  return results;
}

// ── Auto-create interview reminders ──────────────────────────────────────
// Creates 24h-before reminders for upcoming interviews that don't have one yet.

export async function autoCreateInterviewReminders() {
  const now        = new Date();
  const in24h      = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in48h      = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const apps = await Application.find({
    status:     'interview_scheduled',
    interviews: {
      $elemMatch: {
        status:      'scheduled',
        scheduledAt: { $gte: in24h, $lte: in48h },
      },
    },
  }).select('user company role interviews').lean();

  let created = 0;

  for (const app of apps) {
    const upcoming = app.interviews.find(
      i => i.status === 'scheduled'
        && new Date(i.scheduledAt) >= in24h
        && new Date(i.scheduledAt) <= in48h,
    );
    if (!upcoming) continue;

    const reminderAt  = new Date(new Date(upcoming.scheduledAt).getTime() - 60 * 60 * 1000); // 1h before
    const title       = `Interview tomorrow: ${app.company} – ${app.role}`;

    const exists = await Reminder.exists({
      user:  app.user,
      title,
      status: { $in: ['pending', 'sent'] },
    });
    if (exists) continue;

    await Reminder.create({
      user:               app.user,
      type:               'interview',
      title,
      message:            `Your ${app.role} interview at ${app.company} is in less than 24 hours. Make sure you're prepared!`,
      scheduledAt:        reminderAt,
      relatedApplication: app._id,
      metadata:           { interviewId: upcoming._id, scheduledAt: upcoming.scheduledAt },
    });
    created++;
  }

  return created;
}

// ── Dashboard stats ───────────────────────────────────────────────────────

export async function getDashboardStats(userId) {
  const now = new Date();

  const [taskCounts, reminderCounts, apps] = await Promise.all([
    AutomationTask.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Reminder.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Application.find({ user: userId, status: { $nin: ['hired', 'rejected'] } })
      .select('status updatedAt')
      .lean(),
  ]);

  const tasks     = Object.fromEntries(taskCounts.map(r => [r._id, r.count]));
  const reminders = Object.fromEntries(reminderCounts.map(r => [r._id, r.count]));

  const stalled = apps.filter(a => {
    const days = Math.floor((now - new Date(a.updatedAt)) / 86_400_000);
    return ['applied', 'under_review'].includes(a.status) && days >= 7;
  }).length;

  return {
    tasks: {
      pending:   tasks.pending   || 0,
      high:      0,  // resolved below
      completed: tasks.completed || 0,
    },
    reminders: {
      pending: reminders.pending || 0,
      sent:    reminders.sent    || 0,
    },
    pipeline: {
      active:  apps.length,
      stalled,
    },
  };
}
