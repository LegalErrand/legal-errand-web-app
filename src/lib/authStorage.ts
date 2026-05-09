import type { AuthTokens } from './types';

const ACCESS = 'le_access_token';
const PENDING_EMAIL = 'le_pending_verification_email';
const SESSION_EMAIL = 'le_session_email';
const SESSION_PROFILE = 'le_session_onboarding_profile';

/** Names (and email) carried from signup / verify for bio-data prefills. */
export interface SessionOnboardingProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
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
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(ACCESS, token);
}

export function getAccessToken(): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  return sessionStorage.getItem(ACCESS);
}

export function clearAccessToken(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(ACCESS);
}

export function setSessionEmail(email: string): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(SESSION_EMAIL, email);
}

export function getSessionEmail(): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  return sessionStorage.getItem(SESSION_EMAIL);
}

export function setSessionProfile(patch: SessionOnboardingProfile): void {
  if (typeof sessionStorage === 'undefined') return;
  const prev = getSessionProfile();
  sessionStorage.setItem(SESSION_PROFILE, JSON.stringify({ ...prev, ...patch }));
}

export function getSessionProfile(): SessionOnboardingProfile {
  if (typeof sessionStorage === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(SESSION_PROFILE);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SessionOnboardingProfile;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** Resolve bearer token from `/auth/verify-email` (and similar) response payloads. */
export function pickAccessTokenFromPayload(data: AuthTokens | Record<string, unknown> | undefined): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const d = data as Record<string, unknown>;
  if (typeof d.accessToken === 'string' && d.accessToken) return d.accessToken;
  if (typeof d.token === 'string' && d.token) return d.token;
  return undefined;
}
