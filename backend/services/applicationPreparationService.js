/**
 * applicationPreparationService.js
 * ─────────────────────────────────────────────────────────────────────────
 * Orchestrates the full AI preparation workflow for a single application:
 *  1. ATS match scoring (resumeTailorService)
 *  2. Cover letter generation (coverLetterGenerator.service)
 *  3. Checklist population
 *  4. Workspace state transition: saved → prepared
 */

import Application          from '../models/Application.js';
import ApplicationWorkspace from '../models/ApplicationWorkspace.js';
import WorkflowHistory      from '../models/WorkflowHistory.js';
import Resume               from '../models/Resume.js';
import Job                  from '../models/Job.js';
import { calculateATSMatchScore }  from './resumeTailorService.js';
import { generateCoverLetter }     from './coverLetterGenerator.service.js';

// ── helpers ───────────────────────────────────────────────────────────────

async function getResumeText(userId) {
  const resume = await Resume.findOne({ user: userId }).lean();
  if (!resume) return null;
  return resume.rawText || resume.textContent || resume.resumeProfile?.summary || null;
}

function buildJobObject(application, jobDoc) {
  return jobDoc ?? {
    title:           application.role,
    company:         application.company,
    location:        application.location,
    type:            application.type,
    remote:          false,
    description:     application.description || '',
    skills:          [],
    experienceLevel: '',
    salaryMin:       application.salaryMin,
    salaryMax:       application.salaryMax,
  };
}

// ── createWorkspace ───────────────────────────────────────────────────────

/**
 * Get or create the workspace for an application.
 * Idempotent — safe to call multiple times.
 */
export async function ensureWorkspace(userId, applicationId) {
  const existing = await ApplicationWorkspace.findOne({ user: userId, application: applicationId });
  if (existing) return existing;

  const workspace = await ApplicationWorkspace.create({
    user:          userId,
    application:   applicationId,
    workflowState: 'saved',
  });

  await WorkflowHistory.create({
    user:        userId,
    workspace:   workspace._id,
    application: applicationId,
    event:       'workspace_created',
    to:          'saved',
    actor:       'user',
  });

  return workspace;
}

// ── prepareApplication ────────────────────────────────────────────────────

/**
 * Run the full AI preparation for a workspace.
 * @param {string} userId
 * @param {string} workspaceId
 * @param {object} options  — { tone, focusAreas }
 */
export async function prepareApplication(userId, workspaceId, options = {}) {
  const workspace = await ApplicationWorkspace.findOne({ _id: workspaceId, user: userId });
  if (!workspace) throw Object.assign(new Error('Workspace not found'), { status: 404 });

  const application = await Application.findOne({ _id: workspace.application, user: userId });
  if (!application) throw Object.assign(new Error('Application not found'), { status: 404 });

  const resumeText = await getResumeText(userId);
  if (!resumeText) {
    throw Object.assign(
      new Error('No resume found. Upload your resume first to use AI preparation.'),
      { status: 400 },
    );
  }

  // Fetch linked job document for richer data
  const jobDoc = application.job
    ? await Job.findById(application.job).lean().catch(() => null)
    : null;

  const jobDescription = jobDoc?.description || application.description
    || `${application.role} at ${application.company}`;
  const jobObj = buildJobObject(application, jobDoc);

  const tone = ['professional', 'enthusiastic', 'technical', 'concise'].includes(options.tone)
    ? options.tone : 'professional';

  // ATS analysis + cover letter in parallel
  const [atsSettled, clSettled] = await Promise.allSettled([
    calculateATSMatchScore(resumeText, jobDescription),
    generateCoverLetter(resumeText, jobObj, { tone, focusAreas: options.focusAreas }),
  ]);

  const atsData = atsSettled.status === 'fulfilled' ? atsSettled.value : null;
  const clData  = clSettled.status  === 'fulfilled' ? clSettled.value  : null;

  const now     = new Date();
  const updates = {
    'preparation.resumeOptimized': true,
    'preparation.preparedAt':      now,
  };

  if (atsData) {
    updates['ats.score']           = atsData.atsScore           ?? null;
    updates['ats.matchedKeywords'] = atsData.matchedKeywords    ?? [];
    updates['ats.missingKeywords'] = atsData.missingKeywords    ?? [];
    updates['ats.skillGaps']       = atsData.missingSkills?.critical ?? [];
    updates['ats.improvements']    = atsData.improvements       ?? [];
    updates['ats.scoredAt']        = now;
    updates['preparation.atsValidated'] = true;
  }

  if (clData) {
    updates['coverLetter.text']              = clData.coverLetter      || '';
    updates['coverLetter.subjectLine']       = clData.subjectLine      || '';
    updates['coverLetter.tone']              = tone;
    updates['coverLetter.keyHighlights']     = clData.keyHighlights    || [];
    updates['coverLetter.aiRecommendations'] = clData.aiRecommendations || [];
    updates['coverLetter.version']           = (workspace.coverLetter?.version ?? 0) + 1;
    updates['coverLetter.generatedAt']       = now;
    updates['preparation.coverLetterGenerated'] = true;

    if (clData.checklist?.length) {
      updates['checklist'] = clData.checklist.map(c => ({
        item:     c.item,
        category: c.category || 'general',
        priority: c.priority || 'medium',
        done:     false,
      }));
    }
  }

  // Advance state only if still at 'saved'
  const newState = workspace.workflowState === 'saved' ? 'prepared' : workspace.workflowState;
  updates['workflowState'] = newState;

  await ApplicationWorkspace.findByIdAndUpdate(workspaceId, { $set: updates }, { new: true });

  await WorkflowHistory.create({
    user:        userId,
    workspace:   workspaceId,
    application: workspace.application,
    event:       'prepared',
    from:        workspace.workflowState,
    to:          newState,
    metadata:    { atsScore: atsData?.atsScore, coverLetterGenerated: !!clData, tone },
    actor:       'ai',
  });

  return {
    workspaceId:   String(workspaceId),
    workflowState: newState,
    ats:           atsData,
    coverLetter:   clData,
    preparation: {
      resumeOptimized:      true,
      coverLetterGenerated: !!clData,
      atsValidated:         !!atsData,
      checklistComplete:    false,
    },
  };
}

// ── regenerateCoverLetter ─────────────────────────────────────────────────

export async function regenerateCoverLetter(userId, workspaceId, options = {}) {
  const workspace = await ApplicationWorkspace.findOne({ _id: workspaceId, user: userId });
  if (!workspace) throw Object.assign(new Error('Workspace not found'), { status: 404 });

  const application = await Application.findOne({ _id: workspace.application, user: userId });
  if (!application) throw Object.assign(new Error('Application not found'), { status: 404 });

  const resumeText = await getResumeText(userId);
  if (!resumeText) throw Object.assign(new Error('No resume found'), { status: 400 });

  const jobDoc = application.job
    ? await Job.findById(application.job).lean().catch(() => null)
    : null;

  const tone = ['professional', 'enthusiastic', 'technical', 'concise'].includes(options.tone)
    ? options.tone : 'professional';

  const clData = await generateCoverLetter(resumeText, buildJobObject(application, jobDoc), {
    tone,
    focusAreas: options.focusAreas,
  });

  const now = new Date();
  await ApplicationWorkspace.findByIdAndUpdate(workspaceId, {
    $set: {
      'coverLetter.text':               clData.coverLetter      || '',
      'coverLetter.subjectLine':        clData.subjectLine      || '',
      'coverLetter.tone':               tone,
      'coverLetter.keyHighlights':      clData.keyHighlights    || [],
      'coverLetter.aiRecommendations':  clData.aiRecommendations || [],
      'coverLetter.version':            (workspace.coverLetter?.version ?? 0) + 1,
      'coverLetter.generatedAt':        now,
      'preparation.coverLetterGenerated': true,
    },
  });

  await WorkflowHistory.create({
    user: userId, workspace: workspaceId, application: workspace.application,
    event: 'cover_letter_generated', metadata: { tone, version: (workspace.coverLetter?.version ?? 0) + 1 }, actor: 'ai',
  });

  return clData;
}

// ── toggleChecklistItem ───────────────────────────────────────────────────

export async function toggleChecklistItem(userId, workspaceId, itemId, done) {
  const workspace = await ApplicationWorkspace.findOne({ _id: workspaceId, user: userId });
  if (!workspace) throw Object.assign(new Error('Workspace not found'), { status: 404 });

  const item = workspace.checklist.id(itemId);
  if (!item) throw Object.assign(new Error('Checklist item not found'), { status: 404 });

  item.done = done;

  const allDone = workspace.checklist.length > 0 && workspace.checklist.every(c => c.done);
  workspace.preparation.checklistComplete = allDone;
  if (allDone && workspace.workflowState === 'prepared') {
    workspace.workflowState = 'ready_to_apply';
    await WorkflowHistory.create({
      user: userId, workspace: workspaceId, application: workspace.application,
      event: 'state_changed', from: 'prepared', to: 'ready_to_apply', actor: 'system',
    });
  }

  await workspace.save();
  return workspace;
}
