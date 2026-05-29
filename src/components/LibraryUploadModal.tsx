'use client';

import { useRef, useState } from 'react';
import { getFetchErrorMessage } from "@/lib";
import type { PresignedUrlRequest, PresignedUrlResponse, UploadCompleteRequest, ApiResponse } from "@/lib";
import styles from './LibraryUploadModal.module.scss';

interface Props {
  token: string;
  getUploadUrl: (data: PresignedUrlRequest, token: string) => Promise<ApiResponse<PresignedUrlResponse>>;
  completeUpload: (data: UploadCompleteRequest, token: string) => Promise<ApiResponse>;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LibraryUploadModal({ token, getUploadUrl, completeUpload, onClose, onSuccess }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleUpload() {
    if (!file || !title.trim()) { setError('Title and file are required.'); return; }
    setError('');
    setUploading(true);
    try {
      const urlRes = await getUploadUrl({ fileName: file.name, mimeType: file.type, folder: 'LIBRARY' }, token);
      if (!urlRes.data?.uploadUrl) throw new Error('Failed to get upload URL');
      const { uploadUrl, s3Key, s3Url } = urlRes.data;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        });
        xhr.addEventListener('load', () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`))));
        xhr.addEventListener('error', () => reject(new Error('Network error')));
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      const complete = await completeUpload({ title: title.trim(), subject: subject.trim() || undefined, s3Key, s3Url, fileSize: file.size }, token);
      if (!complete.success) throw new Error(complete.message ?? complete.error ?? 'Could not save document');
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
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}

        <div className={styles.field}>
          <label className={styles.label}>Title <span className={styles.req}>*</span></label>
          <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title" />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Subject</label>
          <input className={styles.input} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Constitutional Law" />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>File (PDF) <span className={styles.req}>*</span></label>
          <div className={styles.fileWrap} onClick={() => fileRef.current?.click()}>
            {file ? <span className={styles.fileName}>{file.name}</span> : <span className={styles.filePlaceholder}>Click to choose a PDF file</span>}
            <input ref={fileRef} type="file" accept="application/pdf" className={styles.fileInput} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>

        {uploading && (
          <div className={styles.progressWrap}>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ ['--pct' as string]: `${progress}%` }} />
            </div>
            <span className={styles.progressLabel}>{progress}%</span>
          </div>
        )}

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={uploading}>Cancel</button>
          <button className={styles.submitBtn} onClick={handleUpload} disabled={uploading || !file || !title.trim()}>
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
