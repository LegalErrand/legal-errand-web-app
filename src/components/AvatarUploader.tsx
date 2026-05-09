'use client';

import { useRef, useState } from 'react';
import {
  uploadAvatarWithProgress,
  type UploadProgress,
  type UploadTask,
} from '@/services/upload.service';
import { mapUploadError } from '@/lib/uploadErrors';
import styles from './AvatarUploader.module.scss';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AvatarUploaderProps {
  token: string;
  /** Fresh display URL from `GET /user/avatar-url` after upload (safe for `<img src>`). */
  onSuccess?: (avatarDisplayUrl: string) => void;
}

// ─── Status type ──────────────────────────────────────────────────────────────

type Status = 'idle' | 'uploading' | 'success' | 'error';

// ─── Component ────────────────────────────────────────────────────────────────

export default function AvatarUploader({ token, onSuccess }: AvatarUploaderProps) {
  const [file, setFile]       = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus]   = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const cancelRef = useRef<(() => void) | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setStatus('idle');
    setMessage('');
    setProgress(0);

    if (preview) URL.revokeObjectURL(preview);
    setPreview(selected ? URL.createObjectURL(selected) : null);
  }

  async function handleUpload() {
    if (!file) return;

    setStatus('uploading');
    setProgress(0);
    setMessage('');

    const result = await uploadAvatarWithProgress(
      file,
      token,
      (p: UploadProgress) => setProgress(p.percent),
      (task: UploadTask) => { cancelRef.current = task.cancel; },
    );

    cancelRef.current = null;

    if (result.success) {
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      setFile(null);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setStatus('success');
      setMessage('Avatar updated successfully!');
      if (result.s3Url) onSuccess?.(result.s3Url);
    } else {
      setStatus('error');
      setMessage(mapUploadError(result));
    }
  }

  function handleCancel() {
    cancelRef.current?.();
  }

  const isUploading = status === 'uploading';

  return (
    <div className={styles.container}>

      {preview && status !== 'success' && (
        <img src={preview} alt="" className={styles.preview} />
      )}

      <label className={styles.filePicker}>
        {file ? 'Change image' : 'Choose image'}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={isUploading}
          hidden
        />
      </label>

      {/* Upload button */}
      {file && !isUploading && (
        <button className={styles.uploadBtn} onClick={handleUpload}>
          Upload Avatar
        </button>
      )}

      {/* Progress bar + cancel */}
      {isUploading && (
        <div className={styles.progressArea}>
          <div className={styles.progressTrack} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
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
    </div>
  );
}
