import { clearAccessToken, getAccessToken } from './authStorage';

const CLOCK_SKEW_MS = 5_000;

let loggingOut = false;

function parseJwtPayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(padded)) as { exp?: number };
  } catch {
    return null;
  }
}

export function isAccessTokenExpired(token: string): boolean {
  const payload = parseJwtPayload(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 <= Date.now() + CLOCK_SKEW_MS;
}

/** Returns a non-expired token, clearing storage when the stored token is invalid or expired. */
export function getValidAccessToken(): string | null {
  const token = getAccessToken();
  if (!token) return null;
  if (isAccessTokenExpired(token)) {
    clearAccessToken();
    return null;
  }
  return token;
}

export function loginPath(from?: string): string {
  if (!from || from === '/login') return '/login';
  return `/login?from=${encodeURIComponent(from)}`;
}

/** Clear session and hard-navigate to login (safe to call from API layers). */
export function forceLogoutToLogin(from?: string): void {
  if (typeof window === 'undefined') return;
  clearAccessToken();
  if (loggingOut) return;
  loggingOut = true;
  window.location.assign(loginPath(from));
}
