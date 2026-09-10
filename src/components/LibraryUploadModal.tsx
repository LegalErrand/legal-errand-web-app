'use client';

import { useRef, useState } from 'react';
import { getFetchErrorMessage, uploadLibraryDocumentViaApi } from '@/lib';
import styles from './LibraryUploadModal.module.scss';

const SUBJECT_OPTIONS = [
  'Contract Law',
  'Criminal Law',
  'Tort Law',
  'Constitutional Law',
  'Property Law',
  'Evidence Law',
  'Jurisprudence',
  'Commercial Law',
  'Equity & Trusts',
  'Administrative Law',
  'Family Law',
  'International Law',
] as const;

interface Props {
  token: string;
  /** Kept for call-site compatibility; uploads now go through the API. */
  getUploadUrl?: unknown;
  completeUpload?: unknown;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LibraryUploadModal({ token, onClose, onSuccess }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleUpload() {
    if (!file || !title.trim()) {
      setError('Title and file are required.');
      return;
    }
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
      setError('Only PDF files are supported. Export Word documents to PDF first.');
      return;
    }

    setError('');
    setUploading(true);
    setProgress(0);
    try {
      const res = await uploadLibraryDocumentViaApi({
        file,
        title: title.trim(),
        subject: subject.trim() || undefined,
        token,
        onProgress: setProgress,
      });
      if (!res.success) {
        throw new Error(res.message ?? res.error ?? 'Could not save document');
      }
      onSuccess();
    } catch (err) {
      setError(getFetchErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Upload document">
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Upload Document</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <p className={styles.hint}>
          Upload a PDF judgment or study material. Word (.doc/.docx) is not supported yet — export
          to PDF first.
        </p>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="upload-title">
            Title <span className={styles.req}>*</span>
          </label>
          <input
            id="upload-title"
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document title"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="upload-subject">
            Subject
          </label>
          <select
            id="upload-subject"
            className={styles.input}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="">Select a subject (optional)</option>
            {SUBJECT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            File (PDF) <span className={styles.req}>*</span>
          </label>
          <div className={styles.fileWrap} onClick={() => fileRef.current?.click()}>
            {file ? (
              <span className={styles.fileName}>{file.name}</span>
            ) : (
              <span className={styles.filePlaceholder}>Click to choose a PDF file</span>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,.pdf"
              className={styles.fileInput}
              onChange={(e) => {
                const next = e.target.files?.[0] ?? null;
                setFile(next);
                if (next && !title.trim()) {
                  setTitle(next.name.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' '));
                }
              }}
            />
          </div>
        </div>

        {uploading && (
          <div className={styles.progressWrap}>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ ['--pct' as string]: `${progress}%` }}
              />
            </div>
            <span className={styles.progressLabel}>{progress}%</span>
          </div>
        )}

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={uploading}>
            Cancel
          </button>
          <button
            className={styles.submitBtn}
            onClick={handleUpload}
            disabled={uploading || !file || !title.trim()}
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
