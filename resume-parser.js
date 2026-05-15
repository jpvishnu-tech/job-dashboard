/* ============================================================
   resume-parser.js
   Extracts plain text from a PDF using PDF.js (loaded on demand
   from the cdnjs CDN — no build step required).

   Called by ai-service.js:
     import { extractTextFromPDF } from './resume-parser.js';
     const text = await extractTextFromPDF(firebaseStorageUrl);
   ============================================================ */

// PDF.js 3.4.120 — stable release with full UMD / global support
const PDFJS_VERSION = '3.4.120';
const PDFJS_BASE    = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

let _ready = false;

// ── Lazy-load PDF.js on first use ─────────────────────────────────

async function ensurePdfJs() {
  if (_ready) return;

  // Already injected by another module or script tag
  if (!window.pdfjsLib) {
    await new Promise((resolve, reject) => {
      const script  = document.createElement('script');
      script.src    = `${PDFJS_BASE}/pdf.min.js`;
      script.onload = resolve;
      script.onerror = () =>
        reject(new Error('Could not load PDF.js from CDN. Check your internet connection.'));
      document.head.appendChild(script);
    });
  }

  // Point the web worker to the matching version on the same CDN
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    `${PDFJS_BASE}/pdf.worker.min.js`;

  _ready = true;
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Extracts all text from a PDF accessible at `pdfUrl`.
 * Throws a user-friendly Error on failure.
 *
 * @param  {string} pdfUrl  A publicly-accessible URL (e.g. Firebase Storage download URL)
 * @returns {Promise<string>} Extracted plain text
 */
export async function extractTextFromPDF(pdfUrl) {
  await ensurePdfJs();

  // Load the PDF document
  let pdf;
  try {
    pdf = await window.pdfjsLib.getDocument({ url: pdfUrl }).promise;
  } catch (err) {
    const msg = err?.message ?? '';
    if (msg.toLowerCase().includes('cors') || msg.toLowerCase().includes('cross-origin')) {
      throw new Error(
        'Storage permission error while loading your resume. ' +
        'Try re-uploading your resume and then analyze again.'
      );
    }
    throw new Error(
      'Could not load your resume PDF. ' +
      'Please ensure your resume is still uploaded and try again.'
    );
  }

  // Extract text page by page
  const pageTexts = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page    = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    const text = content.items
      .filter(item => typeof item.str === 'string' && item.str.trim().length > 0)
      .map(item => item.str)
      .join(' ')
      .replace(/[ \t]{3,}/g, '  ');   // collapse excessive whitespace

    if (text.trim()) pageTexts.push(text.trim());
  }

  const fullText = pageTexts.join('\n\n').trim();

  if (!fullText) {
    throw new Error(
      'No text could be extracted from your resume. ' +
      'Your PDF appears to be image-based (e.g. a scan). ' +
      'AI analysis requires a text-based PDF with selectable text. ' +
      'Please export or recreate your resume as a text PDF.'
    );
  }

  return fullText;
}
