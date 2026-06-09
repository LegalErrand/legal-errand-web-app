import type { UploadResult } from '@/services/upload.service';

/**
 * Maps an `UploadResult` to a short, user-friendly string for toast notifications.
 *
 * @example
 * const result = await uploadAvatarWithProgress(file, token, onProgress);
 * toast(mapUploadError(result), { type: result.success ? 'success' : 'error' });
 */
export function mapUploadError(result: UploadResult): string {
  if (result.success) return result.message;

  const { message, statusCode } = result;

  // ─── Status code shortcuts ────────────────────────────────────────────────
  if (statusCode === 401) return 'Session expired. Please log in again.';
  if (statusCode === 403) return 'Upload link expired. Please try again.';
  if (statusCode === 413) return 'File too large. Please choose a smaller file.';
  if (statusCode === 422) return 'Invalid file. Please check the file and retry.';
  if (statusCode === 429) return 'Too many requests. Please wait a moment and retry.';
  if (statusCode && statusCode >= 500) return 'Server error. Please try again shortly.';

  // ─── Message keyword shortcuts ────────────────────────────────────────────
  if (message.includes('cancelled')) return 'Upload cancelled.';
  if (message.includes('expired')) return 'Upload session expired. Please retry.';
  if (message.includes('network')) return 'Network error. Check your connection and retry.';

  // Validation messages are already user-friendly — pass them through.
  if (message.includes('Invalid file type') || message.includes('MB or smaller')) return message;

  return message || 'Upload failed. Please try again.';
}
