import type { AuthTokens } from './types';

const ACCESS = 'le_access_token';
const PENDING_EMAIL = 'le_pending_verification_email';
const SESSION_EMAIL = 'le_session_email';
const SESSION_PROFILE = 'le_session_onboarding_profile';

function migrateItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  const fromLocal = localStorage.getItem(key);
  if (fromLocal) return fromLocal;
  const fromSession = sessionStorage.getItem(key);
  if (!fromSession) return null;
  localStorage.setItem(key, fromSession);
  sessionStorage.removeItem(key);
  return fromSession;
}

function clearAuthKeys(): void {
  if (typeof window === 'undefined') return;
  for (const store of [localStorage, sessionStorage]) {
    store.removeItem(ACCESS);
    store.removeItem(SESSION_EMAIL);
    store.removeItem(SESSION_PROFILE);
  }
}

/** Names (and email) carried from signup / verify for bio-data prefills. */
export interface SessionOnboardingProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
  accountType?: string;
}

export function setPendingVerificationEmail(email: string): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(PENDING_EMAIL, email);
}

export function getPendingVerificationEmail(): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  return sessionStorage.getItem(PENDING_EMAIL);
}

export function clearPendingVerificationEmail(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(PENDING_EMAIL);
}

export function setAccessToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS, token);
}

export function getAccessToken(): string | null {
  return migrateItem(ACCESS);
}

export function clearAccessToken(): void {
  clearAuthKeys();
}

export function setSessionEmail(email: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_EMAIL, email);
}

export function getSessionEmail(): string | null {
  return migrateItem(SESSION_EMAIL);
}

export function setSessionProfile(patch: SessionOnboardingProfile): void {
  if (typeof window === 'undefined') return;
  const prev = getSessionProfile();
  localStorage.setItem(SESSION_PROFILE, JSON.stringify({ ...prev, ...patch }));
}

export function getSessionProfile(): SessionOnboardingProfile {
  if (typeof window === 'undefined') return {};
  try {
    const raw = migrateItem(SESSION_PROFILE);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SessionOnboardingProfile;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** Resolve bearer token from `/auth/verify-email` (and similar) response payloads. */
export function pickAccessTokenFromPayload(
  data: AuthTokens | Record<string, unknown> | undefined
): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const d = data as Record<string, unknown>;
  if (typeof d.accessToken === 'string' && d.accessToken) return d.accessToken;
  if (typeof d.token === 'string' && d.token) return d.token;
  return undefined;
}
