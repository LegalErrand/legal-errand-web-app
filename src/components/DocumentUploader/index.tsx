'use client';

import { useRef, useState } from 'react';
import {
  uploadDocumentWithProgress,
  type UploadProgress,
  type UploadResult,
  type UploadTask,
} from '@/services/upload.service';
import { mapUploadError } from "@/lib";
import styles from './DocumentUploader.module.scss';

// ─── Props ────────────────────────────────────────────────────────────────────

interface DocumentUploaderProps {
  token: string;
  /** Called with the full `UploadResult` after a successful finalize. */
  onSuccess?: (result: UploadResult) => void;
}

// ─── Status type ──────────────────────────────────────────────────────────────

type Status = 'idle' | 'uploading' | 'success' | 'error';

// ─── Component ────────────────────────────────────────────────────────────────

export default function DocumentUploader({ token, onSuccess }: DocumentUploaderProps) {
  const [file, setFile]       = useState<File | null>(null);
  const [title, setTitle]     = useState('');
  const [subject, setSubject] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus]   = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [result, setResult]   = useState<UploadResult | null>(null);

  const cancelRef = useRef<(() => void) | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setStatus('idle');
    setMessage('');
    setProgress(0);
    setResult(null);
    // Pre-fill title from filename if the field is empty.
    if (selected && !title) {
      setTitle(selected.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '));
    }
  }

  async function handleUpload() {
    if (!file || !title.trim()) return;

    setStatus('uploading');
    setProgress(0);
    setMessage('');
    setResult(null);

    const uploadResult = await uploadDocumentWithProgress({
      file,
      title: title.trim(),
      subject: subject.trim() || undefined,
      token,
      onProgress: (p: UploadProgress) => setProgress(p.percent),
      onTask: (task: UploadTask) => { cancelRef.current = task.cancel; },
    });

    cancelRef.current = null;
    setResult(uploadResult);

    if (uploadResult.success) {
      setStatus('success');
      setMessage('Document uploaded successfully!');
      onSuccess?.(uploadResult);
    } else {
      setStatus('error');
      setMessage(mapUploadError(uploadResult));
    }
  }

  function handleCancel() {
    cancelRef.current?.();
  }

  function handleReset() {
    setFile(null);
    setTitle('');
    setSubject('');
    setProgress(0);
    setStatus('idle');
    setMessage('');
    setResult(null);
  }

  const isUploading = status === 'uploading';
  const isSuccess   = status === 'success';

  return (
    <div className={styles.container}>

      {/* File picker */}
      {!isSuccess && (
        <label className={styles.filePicker}>
          {file ? file.name : 'Choose PDF'}
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            disabled={isUploading}
            hidden
          />
        </label>
      )}

      {/* Metadata inputs */}
      {file && !isSuccess && (
        <>
          <input
            className={styles.textInput}
            type="text"
            placeholder="Document title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isUploading}
            aria-label="Document title"
          />
          <input
            className={styles.textInput}
            type="text"
            placeholder="Subject (optional, e.g. LAW 301)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={isUploading}
            aria-label="Subject"
          />
        </>
      )}

      {/* Upload button */}
      {file && !isUploading && !isSuccess && (
        <button
          className={styles.uploadBtn}
          onClick={handleUpload}
          disabled={!title.trim()}
        >
          Upload Document
        </button>
      )}

      {/* Progress bar + cancel */}
      {isUploading && (
        <div className={styles.progressArea}>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className={styles.progressFill} style={{ ['--pct' as string]: `${progress}%` }} />
          </div>
          <span className={styles.progressLabel}>{progress}%</span>
          <button className={styles.cancelBtn} onClick={handleCancel}>
            Cancel
          </button>
        </div>
      )}

      {/* Feedback */}
      {message && (
        <p className={`${styles.message} ${styles[status]}`} role="alert">
          {message}
        </p>
      )}

      {/* Success actions */}
      {isSuccess && result?.s3Url && (
        <div className={styles.successActions}>
          <a
            href={result.s3Url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.viewLink}
          >
            View document →
          </a>
          <button className={styles.resetBtn} onClick={handleReset}>
            Upload another
          </button>
        </div>
      )}
    </div>
  );
}
