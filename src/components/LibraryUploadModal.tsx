'use client';

import { useRef, useState } from 'react';
import { getFetchErrorMessage } from '@/lib';
import type {
  PresignedUrlRequest,
  PresignedUrlResponse,
  UploadCompleteRequest,
  ApiResponse,
} from '@/lib';
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
  getUploadUrl: (
    data: PresignedUrlRequest,
    token: string
  ) => Promise<ApiResponse<PresignedUrlResponse>>;
  completeUpload: (data: UploadCompleteRequest, token: string) => Promise<ApiResponse>;
  onClose: () => void;
  onSuccess: () => void;
}

function resolveMimeType(file: File): string {
  if (file.type) return file.type;
  if (/\.pdf$/i.test(file.name)) return 'application/pdf';
  return 'application/octet-stream';
}

export default function LibraryUploadModal({
  token,
  getUploadUrl,
  completeUpload,
  onClose,
  onSuccess,
}: Props) {
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
      const mimeType = resolveMimeType(file);
      const urlRes = await getUploadUrl(
        {
          fileName: file.name,
          mimeType,
          folder: 'DOCUMENTS',
        },
        token
      );
      if (!urlRes.data?.uploadUrl) throw new Error('Failed to get upload URL');
      const { uploadUrl, s3Key, s3Url } = urlRes.data;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        });
        xhr.addEventListener('load', () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(
                new Error(
                  `Could not upload the file to storage (HTTP ${xhr.status}). Please try again.`
                )
              )
        );
        xhr.addEventListener('error', () =>
          reject(new Error('Network error while uploading. Check your connection and try again.'))
        );
        xhr.open('PUT', uploadUrl);
        // Must match the Content-Type used when the presigned URL was created.
        xhr.setRequestHeader('Content-Type', mimeType);
        xhr.send(file);
      });

      const complete = await completeUpload(
        {
          title: title.trim(),
          subject: subject.trim() || undefined,
          s3Key,
          s3Url,
          fileSize: file.size,
        },
        token
      );
      if (!complete.success)
        throw new Error(complete.message ?? complete.error ?? 'Could not save document');
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
