/**
 * resume.service.js
 * ─────────────────────────────────────────────────────────────
 * Business logic for the resume sub-system.
 *
 * The PDF lives in Firebase Storage; MongoDB stores metadata and
 * AI analysis history.  This service is the single source of truth
 * for resume documents — it coordinates both data stores.
 */

import Resume   from '../models/Resume.js';
import ApiError from '../utils/ApiError.js';

// ── Read ──────────────────────────────────────────────────────

/**
 * getResume(userId)
 * Returns the user's current resume metadata.
 * Throws 404 if no resume has been uploaded.
 */
export async function getResume(userId) {
  const resume = await Resume.findOne({ user: userId });
  if (!resume) throw ApiError.notFound('No resume found. Please upload a PDF resume first.');
  return resume;
}

/**
 * getResumeWithText(userId)
 * Returns the resume including the cached extractedText field.
 * Used internally by AI analysis endpoints.
 */
export async function getResumeWithText(userId) {
  const resume = await Resume.findOne({ user: userId }).select('+extractedText');
  if (!resume) throw ApiError.notFound('No resume found. Please upload a PDF resume first.');
  if (!resume.url) throw ApiError.notFound('Resume URL is missing. Please re-upload your resume.');
  return resume;
}

// ── Write ─────────────────────────────────────────────────────

/**
 * upsertResume(userId, fields)
 * Creates or replaces the resume document for a user.
 * Always an upsert so there is at most one document per user.
 */
export async function upsertResume(userId, { url, fileName, fileSize, storagePath, mimeType }) {
  const resume = await Resume.findOneAndUpdate(
    { user: userId },
    {
      $set: {
        url, fileName, fileSize, storagePath,
        mimeType:      mimeType || 'application/pdf',
        extractedText: null,     // reset cache when file changes
        uploadedAt:    new Date(),
      },
    },
    { upsert: true, new: true, runValidators: true }
  );
  return resume;
}

/**
 * cacheExtractedText(userId, text)
 * Stores the plain-text content so subsequent AI calls can skip
 * re-downloading and re-parsing the PDF.
 */
export async function cacheExtractedText(userId, text) {
  await Resume.findOneAndUpdate(
    { user: userId },
    { $set: { extractedText: text } }
  );
}

/**
 * saveAnalysis(userId, result)
 * Appends an AI analysis result to the resume's history array.
 * Returns the updated resume.
 */
export async function saveAnalysis(userId, result) {
  const resume = await Resume.findOne({ user: userId }).select('+extractedText');
  if (!resume) throw ApiError.notFound('Resume not found');

  resume.addAnalysis(result);     // capped at 50, updates lastAtsScore
  await resume.save();

  // Return without the bulky extractedText field
  const { extractedText: _et, ...rest } = resume.toObject();
  return rest;
}

/**
 * deleteResume(userId)
 * Removes the MongoDB document.
 * The caller is responsible for deleting the file from Firebase Storage.
 */
export async function deleteResume(userId) {
  const doc = await Resume.findOneAndDelete({ user: userId });
  if (!doc) throw ApiError.notFound('Resume not found');
  return doc;
}

// ── History ───────────────────────────────────────────────────

/**
 * getAnalysisHistory(userId, { page, limit })
 * Returns paginated analysis history newest-first.
 */
export async function getAnalysisHistory(userId, { page = 1, limit = 10 } = {}) {
  const resume = await Resume.findOne({ user: userId }).select('analyses lastAtsScore');
  if (!resume) return { data: [], pagination: { total: 0, page: 1, limit, totalPages: 0 } };

  const total    = resume.analyses.length;
  const pageNum  = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));
  const start    = (pageNum - 1) * limitNum;
  const data     = resume.analyses.slice(start, start + limitNum);

  return {
    data,
    pagination: {
      total,
      page:       pageNum,
      limit:      limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}
