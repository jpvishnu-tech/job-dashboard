/**
 * recruiterTrackingService.js
 * ─────────────────────────────────────────────────────────────────────────
 * Manages recruiter contacts: CRUD, communication logs, follow-up reminders,
 * and linking contacts to application workspaces.
 */

import RecruiterContact     from '../models/RecruiterContact.js';
import ApplicationWorkspace from '../models/ApplicationWorkspace.js';
import WorkflowHistory      from '../models/WorkflowHistory.js';

// ── Contacts CRUD ─────────────────────────────────────────────────────────

export async function createContact(userId, data) {
  const contact = await RecruiterContact.create({
    user:            userId,
    name:            data.name,
    company:         data.company         || '',
    title:           data.title           || '',
    email:           data.email           || '',
    phone:           data.phone           || '',
    linkedIn:        data.linkedIn        || '',
    notes:           data.notes           || '',
    tags:            data.tags            || [],
    status:          'active',
    lastContactedAt: (data.email || data.phone) ? new Date() : null,
  });
  return contact;
}

export async function getContacts(userId, { status, search, page = 1, limit = 20 } = {}) {
  const filter = { user: userId };
  if (status) filter.status = status;
  if (search) {
    const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: re }, { company: re }, { email: re }];
  }

  const skip = (page - 1) * limit;
  const [contacts, total] = await Promise.all([
    RecruiterContact.find(filter)
      .sort({ pinned: -1, lastContactedAt: -1, createdAt: -1 })
      .skip(skip).limit(limit).lean(),
    RecruiterContact.countDocuments(filter),
  ]);
  return { contacts, total, page, pages: Math.ceil(total / limit) };
}

export async function getContactById(userId, contactId) {
  const contact = await RecruiterContact.findOne({ _id: contactId, user: userId });
  if (!contact) throw Object.assign(new Error('Contact not found'), { status: 404 });
  return contact;
}

export async function updateContact(userId, contactId, data) {
  const allowed = ['name', 'company', 'title', 'email', 'phone', 'linkedIn', 'status', 'notes', 'tags'];
  const updates = {};
  for (const k of allowed) {
    if (data[k] !== undefined) updates[k] = data[k];
  }
  const contact = await RecruiterContact.findOneAndUpdate(
    { _id: contactId, user: userId },
    { $set: updates },
    { new: true },
  );
  if (!contact) throw Object.assign(new Error('Contact not found'), { status: 404 });
  return contact;
}

export async function deleteContact(userId, contactId) {
  const contact = await RecruiterContact.findOneAndDelete({ _id: contactId, user: userId });
  if (!contact) throw Object.assign(new Error('Contact not found'), { status: 404 });
  return contact;
}

// ── Communication Log ─────────────────────────────────────────────────────

export async function addCommunicationLog(userId, contactId, logData) {
  const contact = await RecruiterContact.findOne({ _id: contactId, user: userId });
  if (!contact) throw Object.assign(new Error('Contact not found'), { status: 404 });

  contact.communicationLog.unshift({
    type:      ['email', 'call', 'linkedin', 'meeting', 'message', 'other'].includes(logData.type)
                 ? logData.type : 'email',
    direction: logData.direction === 'received' ? 'received' : 'sent',
    subject:   logData.subject  || '',
    notes:     logData.notes    || '',
    date:      logData.date     ? new Date(logData.date) : new Date(),
    outcome:   logData.outcome  || '',
  });

  contact.lastContactedAt = new Date();
  if (contact.status === 'active' && logData.direction === 'received') {
    contact.status = 'responded';
  }

  await contact.save();
  return contact;
}

export async function deleteCommunicationLog(userId, contactId, logId) {
  const contact = await RecruiterContact.findOne({ _id: contactId, user: userId });
  if (!contact) throw Object.assign(new Error('Contact not found'), { status: 404 });

  contact.communicationLog = contact.communicationLog.filter(l => String(l._id) !== String(logId));
  await contact.save();
  return contact;
}

// ── Follow-up Reminders ───────────────────────────────────────────────────

export async function addFollowUp(userId, contactId, followUpData) {
  const contact = await RecruiterContact.findOne({ _id: contactId, user: userId });
  if (!contact) throw Object.assign(new Error('Contact not found'), { status: 404 });

  if (!followUpData.dueDate) throw Object.assign(new Error('dueDate is required'), { status: 400 });

  contact.followUps.push({
    dueDate:   new Date(followUpData.dueDate),
    note:      followUpData.note || '',
    completed: false,
  });
  await contact.save();
  return contact;
}

export async function completeFollowUp(userId, contactId, followUpId) {
  const contact = await RecruiterContact.findOne({ _id: contactId, user: userId });
  if (!contact) throw Object.assign(new Error('Contact not found'), { status: 404 });

  const fu = contact.followUps.id(followUpId);
  if (!fu) throw Object.assign(new Error('Follow-up not found'), { status: 404 });

  fu.completed   = true;
  fu.completedAt = new Date();
  await contact.save();
  return contact;
}

export async function getUpcomingFollowUps(userId, daysAhead = 14) {
  const cutoff = new Date(Date.now() + daysAhead * 86400000);

  const contacts = await RecruiterContact.find({
    user:      userId,
    followUps: {
      $elemMatch: { dueDate: { $lte: cutoff }, completed: false },
    },
  }).lean();

  const upcoming = [];
  for (const c of contacts) {
    for (const fu of (c.followUps ?? [])) {
      if (!fu.completed && new Date(fu.dueDate) <= cutoff) {
        upcoming.push({
          contact:  { _id: c._id, name: c.name, company: c.company, email: c.email },
          followUp: fu,
          overdue:  new Date(fu.dueDate) < new Date(),
        });
      }
    }
  }

  return upcoming.sort((a, b) => new Date(a.followUp.dueDate) - new Date(b.followUp.dueDate));
}

// ── Application Linking ───────────────────────────────────────────────────

export async function linkApplication(userId, contactId, applicationId) {
  const contact = await RecruiterContact.findOne({ _id: contactId, user: userId });
  if (!contact) throw Object.assign(new Error('Contact not found'), { status: 404 });

  const alreadyLinked = contact.applications.map(String).includes(String(applicationId));
  if (!alreadyLinked) {
    contact.applications.push(applicationId);
    await contact.save();
  }

  // Reflect in workspace
  await ApplicationWorkspace.findOneAndUpdate(
    { user: userId, application: applicationId },
    { $set: { recruiterContact: contactId } },
  );

  await WorkflowHistory.create({
    user:        userId,
    application: applicationId,
    event:       'recruiter_linked',
    metadata:    { contactId: String(contactId), contactName: contact.name },
    actor:       'user',
  }).catch(() => {});

  return contact;
}

export async function unlinkApplication(userId, contactId, applicationId) {
  const contact = await RecruiterContact.findOne({ _id: contactId, user: userId });
  if (!contact) throw Object.assign(new Error('Contact not found'), { status: 404 });

  contact.applications = contact.applications.filter(id => String(id) !== String(applicationId));
  await contact.save();

  await ApplicationWorkspace.findOneAndUpdate(
    { user: userId, application: applicationId, recruiterContact: contactId },
    { $set: { recruiterContact: null } },
  );

  return contact;
}
