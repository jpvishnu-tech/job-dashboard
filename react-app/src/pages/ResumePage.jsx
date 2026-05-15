import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import './ResumePage.css';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const BUCKET    = 'resumes';

function buildStoragePath(fileName) {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${Date.now()}-${safe}`;
}

export default function ResumePage() {
  const [file,          setFile]          = useState(null);
  const [previewUrl,    setPreviewUrl]    = useState(null);
  const [publicUrl,     setPublicUrl]     = useState(null);
  const [dragging,      setDragging]      = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMsg,      setErrorMsg]      = useState('');
  const [copied,        setCopied]        = useState(false);

  const fileInputRef = useRef(null);
  const dragCounter  = useRef(0);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const processFile = useCallback(async (f) => {
    setErrorMsg('');
    setUploadSuccess(false);

    if (f.type !== 'application/pdf') {
      setErrorMsg('Only PDF files are supported.');
      return;
    }
    if (f.size > MAX_BYTES) {
      setErrorMsg('File must be smaller than 10 MB.');
      return;
    }

    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);

    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setPublicUrl(null);
    setUploading(true);

    const storagePath = buildStoragePath(f.name);

    if (!isSupabaseConfigured) {
      console.error('[Resume] Supabase is not configured — VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.');
      setErrorMsg('Storage is not configured. Please contact support.');
      setUploading(false);
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    // Log the current session so we can confirm auth is working in production.
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('[Resume] Upload start —', storagePath, `(${(f.size / 1024).toFixed(1)} KB)`);
    console.log('[Resume] Supabase session present:', !!sessionData?.session);

    try {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, f, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (error) {
        console.error('[Resume] Upload error —', error.message, error);
        throw new Error(error.message);
      }

      console.log('[Resume] Upload success —', data);

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
      console.log('[Resume] Public URL —', urlData.publicUrl);

      setPublicUrl(urlData.publicUrl);
      setUploadSuccess(true);
    } catch (err) {
      console.error('[Resume] Upload failed —', err);
      setErrorMsg(`Upload failed: ${err.message}`);
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
    e.target.value = '';
  };

  const handleRemove = () => {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setPublicUrl(null);
    setUploading(false);
    setUploadSuccess(false);
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
    if (n < 1024)         return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
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

      {uploadSuccess && (
        <div className="resume-success">
          <span className="material-icons">check_circle</span>
          Resume uploaded successfully!
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        style={{ display: 'none' }}
        onChange={handleFileInput}
      />

      {!file ? (
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

          {uploading && (
            <div className="resume-progress">
              <div className="resume-progress__bar">
                <div className="resume-progress__fill resume-progress__fill--indeterminate" />
              </div>
              <span className="resume-progress__pct">Uploading…</span>
            </div>
          )}

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
