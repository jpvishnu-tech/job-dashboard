import Application from '../models/Application.js';

function tlEvent(type, title, description = '', metadata = {}, actor = 'user') {
  return { type, title, description, metadata, actor, createdAt: new Date() };
}

export async function createApplication(userId, data) {
  const app = await Application.create({
    user:         userId,
    company:      data.company,
    role:         data.role,
    location:     data.location    || '',
    salary:       data.salary      || '',
    salaryMin:    data.salaryMin   ?? null,
    salaryMax:    data.salaryMax   ?? null,
    type:         data.type        || 'full-time',
    url:          data.url         || '',
    description:  data.description || '',
    contactName:  data.contactName  || '',
    contactEmail: data.contactEmail || '',
    status:       data.status      || 'saved',
    priority:     data.priority    || 'medium',
    tags:         data.tags        || [],
    notes:        data.notes       || '',
    job:          data.jobId       || null,
    appliedAt:    data.status === 'applied' ? new Date() : null,
    timeline: [tlEvent('created', 'Application created',
      `Added ${data.company} – ${data.role}`)],
    statusHistory: [{ status: data.status || 'saved', changedAt: new Date() }],
  });
  return app;
}

export async function getApplications(userId, {
  status, priority, sort = 'newest', page = 1, limit = 100,
} = {}) {
  const filter = { user: userId };
  if (status)   filter.status   = status;
  if (priority) filter.priority = priority;

  const sortMap = {
    newest:  { createdAt: -1 },
    oldest:  { createdAt:  1 },
    company: { company:    1 },
    status:  { status:     1 },
  };

  const skip = (page - 1) * limit;
  const [apps, total] = await Promise.all([
    Application.find(filter)
      .sort(sortMap[sort] || { createdAt: -1 })
      .skip(skip).limit(limit).lean(),
    Application.countDocuments(filter),
  ]);

  return { apps, total, page, pages: Math.ceil(total / limit) };
}

export async function getApplicationById(userId, appId) {
  return Application.findOne({ _id: appId, user: userId });
}

export async function updateApplication(userId, appId, data) {
  const allowed = [
    'company', 'role', 'location', 'salary', 'salaryMin', 'salaryMax',
    'type', 'url', 'description', 'contactName', 'contactEmail',
    'priority', 'tags', 'notes',
  ];
  const updates = {};
  for (const key of allowed) {
    if (data[key] !== undefined) updates[key] = data[key];
  }
  return Application.findOneAndUpdate(
    { _id: appId, user: userId },
    { $set: updates },
    { new: true },
  );
}

export async function updateStatus(userId, appId, newStatus, note = '') {
  const app = await Application.findOne({ _id: appId, user: userId });
  if (!app) return null;

  const oldStatus = app.status;
  app.status = newStatus;
  app.statusHistory.push({ status: newStatus, changedAt: new Date(), note });
  app.timeline.unshift(tlEvent(
    'status_change',
    `Moved to ${newStatus.replace(/_/g, ' ')}`,
    note || `From "${oldStatus.replace(/_/g, ' ')}" to "${newStatus.replace(/_/g, ' ')}"`,
    { oldStatus, newStatus },
  ));

  if (newStatus === 'applied' && !app.appliedAt) app.appliedAt = new Date();

  await app.save();
  return app;
}

export async function addNote(userId, appId, note) {
  const app = await Application.findOne({ _id: appId, user: userId });
  if (!app) return null;

  app.notes = note;
  app.timeline.unshift(tlEvent('note_added', 'Note updated', note.slice(0, 120)));
  await app.save();
  return app;
}

export async function addInterview(userId, appId, interviewData) {
  const app = await Application.findOne({ _id: appId, user: userId });
  if (!app) return null;

  const interview = {
    type:        interviewData.type        || 'video',
    scheduledAt: new Date(interviewData.scheduledAt),
    duration:    interviewData.duration    || 60,
    location:    interviewData.location    || '',
    meetingLink: interviewData.meetingLink || '',
    interviewer: interviewData.interviewer || '',
    notes:       interviewData.notes       || '',
    status:      'scheduled',
  };

  app.interviews.push(interview);
  app.timeline.unshift(tlEvent(
    'interview_scheduled',
    `${interview.type.charAt(0).toUpperCase() + interview.type.slice(1)} interview scheduled`,
    `Scheduled for ${new Date(interview.scheduledAt).toLocaleDateString()}`,
    { scheduledAt: interview.scheduledAt, type: interview.type },
  ));

  const earlyStages = ['saved', 'applied', 'under_review', 'pending', 'shortlisted'];
  if (earlyStages.includes(app.status)) {
    app.status = 'interview_scheduled';
    app.statusHistory.push({ status: 'interview_scheduled', changedAt: new Date() });
  }

  await app.save();
  return app;
}

export async function updateInterview(userId, appId, interviewId, data) {
  const app = await Application.findOne({ _id: appId, user: userId });
  if (!app) return null;

  const interview = app.interviews.id(interviewId);
  if (!interview) return null;

  const allowed = [
    'type', 'scheduledAt', 'duration', 'location', 'meetingLink',
    'interviewer', 'notes', 'status', 'feedback', 'outcome',
  ];
  for (const key of allowed) {
    if (data[key] !== undefined) interview[key] = data[key];
  }

  if (data.status === 'completed' && app.status === 'interview_scheduled') {
    app.status = 'interview_completed';
    app.statusHistory.push({ status: 'interview_completed', changedAt: new Date() });
    app.timeline.unshift(tlEvent('interview_completed', 'Interview completed', data.feedback || ''));
  }

  await app.save();
  return app;
}

export async function deleteApplication(userId, appId) {
  return Application.findOneAndDelete({ _id: appId, user: userId });
}

export async function getApplicationTimeline(userId, appId) {
  const app = await Application.findOne({ _id: appId, user: userId }, 'timeline statusHistory');
  return app?.timeline ?? [];
}

export async function getAnalytics(userId) {
  const sixMonthsAgo = new Date(Date.now() - 180 * 86400000);

  const [stageCounts, monthly] = await Promise.all([
    Application.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Application.aggregate([
      { $match: { user: userId, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id:   { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  const total = stageCounts.reduce((s, c) => s + c.count, 0);
  const sm    = {};
  for (const s of stageCounts) sm[s._id] = s.count;

  const interviewCount = (sm.interview_scheduled || 0) + (sm.interview_completed || 0) + (sm.interview || 0);
  const offerCount     = (sm.offer_received || 0) + (sm.offer || 0);
  const hiredCount     = sm.hired    || 0;
  const rejCount       = sm.rejected || 0;
  const appliedCount   = (sm.applied || 0) + (sm.pending || 0);
  const reviewCount    = (sm.under_review || 0) + (sm.shortlisted || 0);
  const savedCount     = sm.saved || 0;

  return {
    total,
    byStage: sm,
    funnel: {
      saved:       savedCount,
      applied:     appliedCount,
      reviewed:    reviewCount,
      interviewed: interviewCount,
      offered:     offerCount,
      hired:       hiredCount,
    },
    rates: {
      interviewRate: total > 0 ? Math.round(interviewCount / total * 100) : 0,
      offerRate:     total > 0 ? Math.round(offerCount     / total * 100) : 0,
      successRate:   total > 0 ? Math.round(hiredCount     / total * 100) : 0,
      rejectionRate: total > 0 ? Math.round(rejCount       / total * 100) : 0,
    },
    monthly,
  };
}
