import type { ApiResponse, UploadResponse, WaitlistFormData } from './types';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api/v1';

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(body || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Waitlist ─────────────────────────────────────────────────────────────────

export async function submitWaitlist(
  data: WaitlistFormData
): Promise<ApiResponse> {
  return apiFetch<ApiResponse>('/waitlist', {
    method: 'POST',
    body: JSON.stringify(data),
    cache: 'no-store',
  });
}

// ─── File upload (multipart) ──────────────────────────────────────────────────

export async function uploadFile(file: File): Promise<UploadResponse> {
  const body = new FormData();
  body.append('file', file);

  // No Content-Type header — browser sets it with boundary automatically
  const res = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    body,
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `Upload failed: HTTP ${res.status}`);
  }

  return res.json() as Promise<UploadResponse>;
}

// ─── Generic GET with revalidation ───────────────────────────────────────────

export async function fetchWithCache<T>(
  path: string,
  revalidate = 60
): Promise<T> {
  return apiFetch<T>(path, {
    next: { revalidate },
  } as RequestInit);
}
