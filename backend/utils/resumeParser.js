import { PDFParse } from 'pdf-parse';
import Resume        from '../models/Resume.js';

/**
 * extractText(resumeDoc)
 *
 * Returns the plain text of the resume PDF.
 * On first call it downloads from Firebase Storage, parses with pdf-parse,
 * and caches the result in Resume.extractedText so future calls are instant.
 */
export async function extractText(resumeDoc) {
  const fresh = await Resume.findById(resumeDoc._id).select('+extractedText');
  if (fresh?.extractedText) return fresh.extractedText;

  const response = await fetch(resumeDoc.url);
  if (!response.ok) {
    throw Object.assign(
      new Error(`PDF download failed (HTTP ${response.status}). Try re-uploading your resume.`),
      { status: 502 },
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  let textResult;
  try {
    const parser = new PDFParse({ data: buffer });
    await parser.load();
    textResult = await parser.getText();
    await parser.destroy();
  } catch {
    throw Object.assign(
      new Error('PDF parsing failed. Make sure your file is a valid, text-based PDF.'),
      { status: 422 },
    );
  }

  const cleaned = (textResult.text ?? '')
    .replace(/[ \t]{3,}/g, '  ')
    .trim();

  if (cleaned.length < 50) {
    throw Object.assign(
      new Error('No readable text found. Your PDF may be image-only — please use a text-based PDF.'),
      { status: 422 },
    );
  }

  if (cleaned.length > 15_000) {
    throw Object.assign(
      new Error('Resume exceeds 15,000 characters. Please use a shorter document.'),
      { status: 422 },
    );
  }

  await Resume.findByIdAndUpdate(resumeDoc._id, { extractedText: cleaned });
  return cleaned;
}
