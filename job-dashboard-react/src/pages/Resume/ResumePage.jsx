import { useState, useEffect, useRef } from 'react';
import { useAuth }                     from '../../context/AuthContext';
import { uploadResume, getResumeData, deleteResume } from '../../services/resume';
import AtsPanel       from './panels/AtsPanel';
import OptimizerPanel from './panels/OptimizerPanel';
import RewriterPanel  from './panels/RewriterPanel';
import HistoryPanel   from './panels/HistoryPanel';
import TailorPanel    from './panels/TailorPanel';
import VersionsPanel  from './panels/VersionsPanel';
import './ResumePage.css';

const TABS = [
  { id: 'ats',       label: 'ATS Analysis',   icon: 'psychology'    },
  { id: 'optimizer', label: 'Job Optimizer',  icon: 'tune'          },
  { id: 'tailor',    label: 'Job Tailor',     icon: 'content_cut'   },
  { id: 'rewriter',  label: 'AI Rewriter',    icon: 'auto_fix_high' },
  { id: 'versions',  label: 'Saved Versions', icon: 'bookmarks'     },
  { id: 'history',   label: 'History',        icon: 'history'       },
];

function formatBytes(bytes) {
  if (!bytes) return '';
  const kb = bytes / 1024;
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
}

function formatDate(val) {
  if (!val) return '';
  const d = val.toDate ? val.toDate() : new Date(val);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ResumePage() {
  const { user } = useAuth();

  const [resumeData,    setResumeData]    = useState(null);
  const [uploading,     setUploading]     = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError,   setUploadError]   = useState('');
  const [loadingResume, setLoadingResume] = useState(true);
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('ats');

  // getToken returns a fresh Firebase ID token for backend API calls
  const getToken = () => user.getIdToken();

  useEffect(() => {
    if (!user) return;
    getResumeData(getToken)
      .then(data => setResumeData(data))
      .catch(() => {})
      .finally(() => setLoadingResume(false));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { setUploadError('Only PDF files are supported.'); return; }
    if (file.size > 10 * 1024 * 1024)   { setUploadError('File must be smaller than 10 MB.'); return; }

    setUploadError('');
    setUploadSuccess(false);
    setUploading(true);

    try {
      const url = await uploadResume(user.uid, file, getToken);
      setResumeData({ url, fileName: file.name, fileSize: file.size, uploadedAt: new Date() });
      setUploadSuccess(true);
    } catch (err) {
      console.error('[Resume] handleFileSelect error —', err);
      setUploadError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete() {
    if (!confirm('Delete your resume?')) return;
    try {
      await deleteResume(getToken);
      setResumeData(null);
      setUploadSuccess(false);
    } catch (err) {
      setUploadError(err.message);
    }
  }

  const hasResume = Boolean(resumeData?.url);

  return (
    <div className="resume-page">
      {/* ── Upload card ──────────────────────────────────────────── */}
      <div className="card resume-upload-card">
        <div className="resume-upload-header">
          <div className="resume-upload-icon">
            <span className="material-icons">description</span>
          </div>
          <div>
            <h3 className="resume-upload-title">Resume</h3>
            <p className="resume-upload-sub">Upload a text-based PDF for AI analysis</p>
          </div>
        </div>

        {loadingResume ? (
          <div style={{ padding: '20px 0' }}><div className="spinner" /></div>
        ) : hasResume ? (
          <div className="resume-file-info">
            <span className="material-icons resume-file-icon">picture_as_pdf</span>
            <div className="resume-file-details">
              <span className="resume-file-name">{resumeData.fileName || 'resume.pdf'}</span>
              <span className="resume-file-meta">
                {formatBytes(resumeData.fileSize)}
                {resumeData.uploadedAt && ` · Uploaded ${formatDate(resumeData.uploadedAt)}`}
              </span>
            </div>
            <div className="resume-file-actions">
              <a href={resumeData.url} target="_blank" rel="noopener noreferrer"
                className="btn btn--secondary btn--sm">
                <span className="material-icons">open_in_new</span>View
              </a>
              <button className="btn btn--secondary btn--sm" onClick={() => fileInputRef.current?.click()}>
                <span className="material-icons">upload_file</span>Replace
              </button>
              <button className="btn btn--danger btn--sm" onClick={handleDelete}>
                <span className="material-icons">delete</span>Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="resume-dropzone" onClick={() => fileInputRef.current?.click()}>
            <span className="material-icons resume-dropzone-icon">cloud_upload</span>
            <p className="resume-dropzone-text">Click to upload your resume</p>
            <p className="resume-dropzone-sub">PDF only, max 10 MB</p>
          </div>
        )}

        {/* Indeterminate progress bar — shown while Supabase upload is in-flight */}
        {uploading && (
          <div className="resume-progress">
            <div className="resume-progress-bar resume-progress-bar--indeterminate" />
            <span className="resume-progress-pct">Uploading…</span>
          </div>
        )}

        {/* Success banner */}
        {uploadSuccess && !uploading && (
          <div className="resume-upload-success">
            <span className="material-icons">check_circle</span>
            Resume uploaded successfully!
          </div>
        )}

        {uploadError && (
          <div className="inline-error" style={{ marginTop: 12 }}>
            <span className="material-icons" style={{ fontSize: 16 }}>error_outline</span>
            {uploadError}
          </div>
        )}

        <input type="file" ref={fileInputRef} accept="application/pdf"
          style={{ display: 'none' }} onChange={handleFileSelect} />
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────── */}
      <div className="card ro-tab-bar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`ro-tab ${activeTab === tab.id ? 'ro-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="material-icons">{tab.icon}</span>
            <span className="ro-tab__label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Active panel ─────────────────────────────────────────── */}
      <div className="card">
        {activeTab === 'ats'       && <AtsPanel       hasResume={hasResume} />}
        {activeTab === 'optimizer' && <OptimizerPanel  hasResume={hasResume} />}
        {activeTab === 'tailor'    && <TailorPanel     hasResume={hasResume} />}
        {activeTab === 'rewriter'  && <RewriterPanel   hasResume={hasResume} />}
        {activeTab === 'versions'  && <VersionsPanel   hasResume={hasResume} />}
        {activeTab === 'history'   && <HistoryPanel    hasResume={hasResume} />}
      </div>
    </div>
  );
}
