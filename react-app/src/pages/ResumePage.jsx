import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './ResumePage.css';

const MAX_BYTES  = 10 * 1024 * 1024; // 10 MB
const BUCKET     = 'resumes';

/**
 * Upload a file to Supabase Storage via XMLHttpRequest so that the
 * onprogress event delivers real byte-level progress to the UI.
 * progressRef is populated so callers can call .abort() on unmount.
 *
 * Returns the Supabase public URL for the uploaded object.
 */
function uploadToSupabase(file, storagePath, progressRef, onProgress) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    progressRef.current = xhr;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      progressRef.current = null;
      if (xhr.status === 200 || xhr.status === 201) {
        // Derive the public URL from the known Supabase Storage URL pattern.
        // Requires the "resumes" bucket to have public access enabled in the
        // Supabase dashboard (Storage → Policies → Make bucket public).
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
        resolve(data.publicUrl);
      } else {
        let msg = `Upload failed (${xhr.status})`;
        try { msg = JSON.parse(xhr.responseText)?.message ?? msg; } catch { /* keep default */ }
        reject(new Error(msg));
      }
    };

    xhr.onerror  = () => { progressRef.current = null; reject(new Error('Network error during upload')); };
    xhr.onabort  = () => { progressRef.current = null; reject(new Error('Upload cancelled')); };

    // PUT with x-upsert:true overwrites an object with the same path, which
    // means Replace works without needing a prior delete call.
    xhr.open('PUT', `${supabaseUrl}/storage/v1/object/${BUCKET}/${encodeURIComponent(storagePath)}`);
    xhr.setRequestHeader('Authorization',  `Bearer ${supabaseKey}`);
    xhr.setRequestHeader('Content-Type',   'application/pdf');
    xhr.setRequestHeader('x-upsert',       'true');
    xhr.send(file);
  });
}

/** Build a unique, filesystem-safe storage path for a given file. */
function buildStoragePath(fileName) {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${Date.now()}-${safe}`;
}

export default function ResumePage() {
  const [file,       setFile]       = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [publicUrl,  setPublicUrl]  = useState(null);
  const [dragging,   setDragging]   = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [progress,   setProgress]   = useState(0);
  const [errorMsg,   setErrorMsg]   = useState('');
  const [copied,     setCopied]     = useState(false);

  const fileInputRef = useRef(null);
  const dragCounter  = useRef(0);
  // Holds the live XMLHttpRequest so it can be aborted on unmount or remove.
  const progressRef  = useRef(null);

  // Revoke the blob URL when it changes or on unmount.
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Abort any in-flight upload when the component unmounts.
  useEffect(() => {
    return () => { progressRef.current?.abort(); };
  }, []);

  const processFile = useCallback(async (f) => {
    setErrorMsg('');

    if (f.type !== 'application/pdf') {
      setErrorMsg('Only PDF files are supported.');
      return;
    }
    if (f.size > MAX_BYTES) {
      setErrorMsg('File must be smaller than 10 MB.');
      return;
    }

    // Release the previous blob URL before creating a new one.
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);

    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setPublicUrl(null);
    setUploading(true);
    setProgress(0);

    const storagePath = buildStoragePath(f.name);

    try {
      const url = await uploadToSupabase(f, storagePath, progressRef, setProgress);
      setPublicUrl(url);
    } catch (err) {
      // Ignore deliberate aborts triggered by handleRemove / unmount.
      if (err.message === 'Upload cancelled') return;
      setErrorMsg(`Upload failed: ${err.message}`);
      // Roll back UI to the drop-zone state on error.
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
      setFile(null);
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  }, [previewUrl]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    dragCounter.current = 0;
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  const handleDragOver  = (e) => e.preventDefault();

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current++;
    setDragging(true);
  };

  const handleDragLeave = () => {
    dragCounter.current--;
    if (dragCounter.current === 0) setDragging(false);
  };

  const handleFileInput = (e) => {
    const f = e.target.files[0];
    if (f) processFile(f);
    e.target.value = ''; // allow re-selecting the same file
  };

  const handleRemove = () => {
    progressRef.current?.abort();
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setPublicUrl(null);
    setUploading(false);
    setProgress(0);
    setErrorMsg('');
    setCopied(false);
  };

  const handleCopyLink = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatBytes = (n) => {
    if (n < 1024)           return `${n} B`;
    if (n < 1024 * 1024)   return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <div className="content__header">
        <div>
          <h1 className="content__title">Resume</h1>
          <p className="content__subtitle">Upload and preview your resume PDF.</p>
        </div>
        {file && !uploading && (
          <button className="btn btn--primary" onClick={() => fileInputRef.current?.click()}>
            <span className="material-icons">upload_file</span>
            Replace
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="resume-error">
          <span className="material-icons">error_outline</span>
          {errorMsg}
        </div>
      )}

      {/* Hidden file input — triggered by drop zone click or Replace button */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        style={{ display: 'none' }}
        onChange={handleFileInput}
      />

      {!file ? (
        /* ── Drop zone ───────────────────────────────────────────── */
        <div
          className={`resume-dropzone${dragging ? ' resume-dropzone--active' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        >
          <span className="material-icons resume-dropzone__icon">
            {dragging ? 'file_download' : 'upload_file'}
          </span>
          <p className="resume-dropzone__primary">
            {dragging ? 'Drop to upload' : 'Drop your PDF here or click to browse'}
          </p>
          <p className="resume-dropzone__secondary">PDF only · Max 10 MB</p>
        </div>
      ) : (
        /* ── File card ───────────────────────────────────────────── */
        <div className="card resume-card">
          <div className="resume-meta">
            <span className="material-icons resume-meta__icon">picture_as_pdf</span>
            <div className="resume-meta__info">
              <span className="resume-meta__name">{file.name}</span>
              <span className="resume-meta__size">{formatBytes(file.size)}</span>
            </div>
            {!uploading && (
              <div className="resume-meta__actions">
                {publicUrl && (
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={handleCopyLink}
                    title="Copy public link"
                  >
                    <span className="material-icons">{copied ? 'check' : 'link'}</span>
                  </button>
                )}
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => fileInputRef.current?.click()}
                  title="Replace file"
                >
                  <span className="material-icons">swap_horiz</span>
                </button>
                <button
                  className="btn btn--ghost btn--sm resume-meta__delete"
                  onClick={handleRemove}
                  title="Remove file"
                >
                  <span className="material-icons">delete_outline</span>
                </button>
              </div>
            )}
          </div>

          {/* Upload progress bar */}
          {uploading && (
            <div className="resume-progress">
              <div className="resume-progress__bar">
                <div
                  className="resume-progress__fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="resume-progress__pct">{Math.round(progress)}%</span>
            </div>
          )}

          {/* Inline PDF preview */}
          {previewUrl && !uploading && (
            <div className="resume-preview">
              <iframe
                src={previewUrl}
                className="resume-preview__frame"
                title="Resume preview"
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
