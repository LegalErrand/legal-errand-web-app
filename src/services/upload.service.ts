/**
 * Upload Service — pre-signed S3 flow with real-time XHR progress.
 *
 * ⚠️  Browser-only module (uses XMLHttpRequest). Import only inside 'use client' components.
 *
 * Avatar flow (matches backend): `POST /library/upload-url` (folder `AVATARS`) → PUT file to
 * `signedUrl` → `PUT /user/avatar` with `{ avatar: s3Key, s3Key }` → `GET /user/avatar-url`
 * for a fresh display URL.
 *
 * Quick usage:
 *
 *   // Avatar (full flow — sign → S3 → finalize)
 *   const result = await uploadAvatarWithProgress(file, token, (p) => setProgress(p.percent));
 *   if (result.success) setAvatarUrl(result.s3Url!);
 *
 *   // Document (full flow — sign → S3 → finalize)
 *   const result = await uploadDocumentWithProgress({
 *     file, title: 'Contract Law Notes', subject: 'LAW 301', token,
 *     onProgress: (p) => setProgress(p.percent),
 *   });
 *   if (result.success) navigate(`/library/${result.s3Key}`);
 */

import { forceLogoutToLogin } from '@/lib/session';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3003/api/v1';

// ─── Size limits ──────────────────────────────────────────────────────────────

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; //  5 MB
const MAX_DOCUMENT_BYTES = 50 * 1024 * 1024; // 50 MB

// ─── Public types ─────────────────────────────────────────────────────────────

export type UploadFolder = 'AVATARS' | 'DOCUMENTS' | 'LIBRARY';

/** Data returned by the sign-upload endpoint. */
export interface SignedUploadData {
  uploadUrl: string;
  s3Key: string;
  s3Url: string;
  /** Seconds until the pre-signed URL expires. */
  expiresIn: number;
}

/** Emitted by `onProgress` callbacks during an S3 PUT. */
export interface UploadProgress {
  loaded: number;
  total: number;
  /** Integer from 0 to 100 inclusive. Guaranteed to reach 100 on success. */
  percent: number;
}

/** Normalized result returned by all high-level upload functions. */
export interface UploadResult {
  success: boolean;
  message: string;
  s3Key?: string;
  /** Object URL for documents; for avatars, fresh presigned display URL from `GET /user/avatar-url`. */
  s3Url?: string;
  /** HTTP status of the failed request, when applicable. */
  statusCode?: number;
}

/**
 * Returned by `uploadToS3WithProgress`.
 * Await `promise` for completion; call `cancel()` to abort mid-upload.
 */
export interface UploadTask {
  promise: Promise<void>;
  cancel: () => void;
}

/** Params for `uploadDocumentWithProgress`. */
export interface UploadDocumentParams {
  file: File;
  title: string;
  subject?: string;
  token: string;
  onProgress?: (progress: UploadProgress) => void;
  /**
   * Called synchronously with the `UploadTask` once the S3 PUT starts.
   * Store `task.cancel` in a ref to wire up a cancel button.
   *
   * @example
   * onTask: (task) => { cancelRef.current = task.cancel; }
   */
  onTask?: (task: UploadTask) => void;
}

// ─── Internal types ───────────────────────────────────────────────────────────

/** API may return OpenAPI shape (`signedUrl`) or legacy (`uploadUrl`), wrapped or flat. */
interface SignUploadRawPayload {
  signedUrl?: string;
  uploadUrl?: string;
  s3Key?: string;
  s3Url?: string;
  expiresIn?: number;
}

interface SignUploadApiResponse {
  success?: boolean;
  data?: SignUploadRawPayload;
  signedUrl?: string;
  uploadUrl?: string;
  s3Key?: string;
  s3Url?: string;
  expiresIn?: number;
  message?: string;
  error?: string;
}

function normalizeSignedPayload(raw: SignUploadRawPayload): SignedUploadData {
  const uploadUrl = raw.signedUrl ?? raw.uploadUrl ?? '';
  const s3Key = raw.s3Key ?? '';
  if (!uploadUrl || !s3Key) {
    throw new UploadError('Invalid sign response: missing URL or key.', 'sign');
  }
  const s3Url = raw.s3Url ?? uploadUrl.split('?')[0];
  return {
    uploadUrl,
    s3Key,
    s3Url,
    expiresIn: raw.expiresIn ?? 0,
  };
}

type ErrorStage = 'validation' | 'sign' | 's3' | 'finalize';

// ─── Internal error class ─────────────────────────────────────────────────────

class UploadError extends Error {
  constructor(
    message: string,
    public readonly stage: ErrorStage,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'UploadError';
  }
}

// ─── File validation ──────────────────────────────────────────────────────────

const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const DOCUMENT_TYPES = ['application/pdf'] as const;

function validateAvatar(file: File): void {
  if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) {
    throw new UploadError('Invalid file type. Avatars must be JPEG, PNG, or WebP.', 'validation');
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new UploadError('Avatar must be 5 MB or smaller.', 'validation');
  }
}

function validateDocument(file: File): void {
  if (!(DOCUMENT_TYPES as readonly string[]).includes(file.type)) {
    throw new UploadError('Invalid file type. Documents must be PDF.', 'validation');
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new UploadError('Document must be 50 MB or smaller.', 'validation');
  }
}

// ─── Auth fetch helper ────────────────────────────────────────────────────────

async function authFetch<T>(
  path: string,
  token: string,
  options: RequestInit,
  stage: ErrorStage
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  } catch {
    throw new UploadError(`${stage} request failed: network error.`, stage);
  }

  if (!res.ok) {
    if (res.status === 401) {
      forceLogoutToLogin();
    }
    const body = await res.text().catch(() => res.statusText);
    throw new UploadError(body || `HTTP ${res.status}`, stage, res.status);
  }

  return res.json() as Promise<T>;
}

interface AvatarUrlApiResponse {
  success?: boolean;
  data?: { avatarUrl?: string };
  avatarUrl?: string;
}

function parseAvatarDisplayUrl(json: AvatarUrlApiResponse): string | undefined {
  const nested = json.data?.avatarUrl;
  const flat = json.avatarUrl;
  if (typeof nested === 'string' && nested) return nested;
  if (typeof flat === 'string' && flat) return flat;
  return undefined;
}

// ─── Step 1: Get pre-signed upload URL ───────────────────────────────────────

export async function getUploadUrl(
  file: File,
  folder: UploadFolder,
  token: string
): Promise<SignedUploadData> {
  const response = await authFetch<SignUploadApiResponse>(
    '/library/upload-url',
    token,
    {
      method: 'POST',
      body: JSON.stringify({ fileName: file.name, mimeType: file.type, folder }),
      cache: 'no-store',
    },
    'sign'
  );

  const flat: SignUploadRawPayload | undefined =
    response.data ??
    (response.signedUrl || response.uploadUrl
      ? {
          signedUrl: response.signedUrl,
          uploadUrl: response.uploadUrl,
          s3Key: response.s3Key,
          s3Url: response.s3Url,
          expiresIn: response.expiresIn,
        }
      : undefined);

  if (response.success === false || !flat) {
    throw new UploadError(
      response.error ?? response.message ?? 'Could not obtain upload URL.',
      'sign'
    );
  }

  return normalizeSignedPayload(flat);
}

// ─── Step 2: Upload to S3 with progress ──────────────────────────────────────

/**
 * PUT the file to S3 using the pre-signed URL.
 * Returns an `UploadTask` — await `.promise` and call `.cancel()` to abort.
 *
 * - Emits 0 % immediately so callers can initialize progress UI.
 * - Guarantees 100 % is emitted on successful completion.
 * - 403 response maps to a distinct "URL expired" error.
 */
export function uploadToS3WithProgress(
  uploadUrl: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): UploadTask {
  // xhr is nulled out after completion so cancel() becomes a safe no-op.
  let xhr: XMLHttpRequest | null = new XMLHttpRequest();

  const emit = (loaded: number, total: number): void => {
    onProgress?.({
      loaded,
      total,
      percent: total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0,
    });
  };

  const promise = new Promise<void>((resolve, reject) => {
    // Capture a non-null ref for use inside event handlers.
    const x = xhr!;

    emit(0, file.size); // ← initial 0 % tick

    x.upload.addEventListener('progress', (ev) => {
      if (ev.lengthComputable) emit(ev.loaded, ev.total);
    });

    x.addEventListener('load', () => {
      if (x.status === 403) {
        reject(new UploadError('Pre-signed URL has expired. Please retry.', 's3', 403));
      } else if (x.status < 200 || x.status >= 300) {
        reject(new UploadError(`S3 upload failed: HTTP ${x.status}.`, 's3', x.status));
      } else {
        emit(file.size, file.size); // ← guaranteed 100 %
        resolve();
      }
      xhr = null;
    });

    x.addEventListener('error', () => {
      xhr = null;
      reject(new UploadError('S3 upload failed: network error.', 's3'));
    });

    x.addEventListener('abort', () => {
      xhr = null;
      reject(new UploadError('Upload cancelled.', 's3'));
    });

    x.open('PUT', uploadUrl);
    const contentType =
      file.type || (/\.pdf$/i.test(file.name) ? 'application/pdf' : 'application/octet-stream');
    x.setRequestHeader('Content-Type', contentType);
    x.send(file);
  });

  return {
    promise,
    cancel: () => xhr?.abort(),
  };
}

// ─── Avatar upload — full flow ────────────────────────────────────────────────

/**
 * Validate → sign → PUT to S3 → finalize avatar.
 *
 * Pass `onTask` to receive the `UploadTask` and wire up a cancel button:
 * ```tsx
 * const cancelRef = useRef<(() => void) | null>(null);
 * uploadAvatarWithProgress(file, token, onProgress, (t) => { cancelRef.current = t.cancel; });
 * // <button onClick={() => cancelRef.current?.()}>Cancel</button>
 * ```
 */
export async function uploadAvatarWithProgress(
  file: File,
  token: string,
  onProgress?: (progress: UploadProgress) => void,
  onTask?: (task: UploadTask) => void
): Promise<UploadResult> {
  try {
    validateAvatar(file);

    const { uploadUrl, s3Key } = await getUploadUrl(file, 'AVATARS', token);

    const task = uploadToS3WithProgress(uploadUrl, file, onProgress);
    onTask?.(task);
    await task.promise;

    await authFetch(
      '/user/avatar',
      token,
      {
        method: 'PUT',
        body: JSON.stringify({ avatar: s3Key, s3Key }),
        cache: 'no-store',
      },
      'finalize'
    );

    const avatarJson = await authFetch<AvatarUrlApiResponse>(
      '/user/avatar-url',
      token,
      { method: 'GET', cache: 'no-store' },
      'finalize'
    );
    const displayUrl = parseAvatarDisplayUrl(avatarJson);

    return {
      success: true,
      message: 'Avatar uploaded successfully.',
      s3Key,
      s3Url: displayUrl,
    };
  } catch (err) {
    if (err instanceof UploadError) {
      return { success: false, message: err.message, statusCode: err.statusCode };
    }
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

// ─── Document upload — full flow ──────────────────────────────────────────────

/**
 * Validate → sign → PUT to S3 → finalize document.
 *
 * Include `onTask` in params to enable cancel support:
 * ```tsx
 * const cancelRef = useRef<(() => void) | null>(null);
 * uploadDocumentWithProgress({ ..., onTask: (t) => { cancelRef.current = t.cancel; } });
 * ```
 */
export async function uploadDocumentWithProgress(
  params: UploadDocumentParams
): Promise<UploadResult> {
  const { file, title, subject, token, onProgress, onTask } = params;

  try {
    validateDocument(file);

    const { uploadUrl, s3Key, s3Url } = await getUploadUrl(file, 'DOCUMENTS', token);

    const task = uploadToS3WithProgress(uploadUrl, file, onProgress);
    onTask?.(task);
    await task.promise;

    await authFetch(
      '/library/upload/complete',
      token,
      {
        method: 'POST',
        body: JSON.stringify({
          title,
          ...(subject ? { subject } : {}),
          s3Key,
          s3Url,
          fileSize: file.size,
        }),
        cache: 'no-store',
      },
      'finalize'
    );

    return { success: true, message: 'Document uploaded successfully.', s3Key, s3Url };
  } catch (err) {
    if (err instanceof UploadError) {
      return { success: false, message: err.message, statusCode: err.statusCode };
    }
    return { success: false, message: 'An unexpected error occurred.' };
  }
}
