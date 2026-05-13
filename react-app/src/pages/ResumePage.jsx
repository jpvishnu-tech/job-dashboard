import { useState, useRef, useCallback, useEffect } from 'react';
import './ResumePage.css';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * ResumePage
 * ─────────────────────────────────────────────────────────────
 * Drag-and-drop PDF upload with inline preview.
 * In placeholder mode (no Firebase credentials) the file is stored
 * only in memory via URL.createObjectURL — it is not persisted.
 * With real Firebase credentials, wire uploadBytesResumable from
 * firebase/storage to persist the file to Firebase Storage.
 */
export default function ResumePage() {
  const [file,       setFile]       = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragging,   setDragging]   = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [progress,   setProgress]   = useState(0);
  const [errorMsg,   setErrorMsg]   = useState('');

  const fileInputRef = useRef(null);
  const dragCounter  = useRef(0);  // tracks nested drag-enter/leave events
  const progressRef  = useRef(null);

  // Revoke the object URL when it changes or the component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Clean up in-progress simulated upload on unmount
  useEffect(() => {
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, []);

  const processFile = useCallback((f) => {
    setErrorMsg('');

    if (f.type !== 'application/pdf') {
      setErrorMsg('Only PDF files are supported.');
      return;
    }
    if (f.size > MAX_BYTES) {
      setErrorMsg('File must be smaller than 10 MB.');
      return;
    }

    // Release the previous blob URL before creating a new one
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);

    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));

    // Simulate upload progress (replace with uploadBytesResumable for real uploads)
    setUploading(true);
    setProgress(0);
    let p = 0;
    progressRef.current = setInterval(() => {
      p += Math.random() * 18 + 5;
      if (p >= 100) {
        clearInterval(progressRef.current);
        setProgress(100);
        setUploading(false);
        return;
      }
      setProgress(p);
    }, 160);
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
    if (progressRef.current) clearInterval(progressRef.current);
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setUploading(false);
    setProgress(0);
    setErrorMsg('');
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
