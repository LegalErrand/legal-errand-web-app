import { googleAuth } from './api';
import {
  pickAccessTokenFromPayload,
  setAccessToken,
  setSessionEmail,
  setSessionProfile,
} from './authStorage';

const GIS_SRC = 'https://accounts.google.com/gsi/client';

const DEFAULT_GOOGLE_CLIENT_ID =
  '213900474517-9sr3u68bdgm8mpbha577lvqme595qs8a.apps.googleusercontent.com';

export function getGoogleClientId(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || DEFAULT_GOOGLE_CLIENT_ID;
}

function loadGoogleScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Sign-In is only available in the browser.'));
  }
  if (window.google?.accounts?.oauth2) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Failed to load Google Sign-In.')),
        { once: true }
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Sign-In.'));
    document.head.appendChild(script);
  });
}

export async function requestGoogleAccessToken(): Promise<string> {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error('Google sign-in is not configured.');
  }

  await loadGoogleScript();
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) {
    throw new Error('Google Sign-In failed to load. Please try again.');
  }

  return new Promise((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(
            new Error(
              resp.error === 'popup_closed_by_user' || resp.error === 'access_denied'
                ? 'Google sign-in was cancelled.'
                : 'Google sign-in failed. Please try again.'
            )
          );
          return;
        }
        resolve(resp.access_token);
      },
    });
    client.requestAccessToken();
  });
}

export async function signInWithGoogle(opts?: {
  accountType?: 'Undergraduate' | 'Law School Student';
}): Promise<{ isNewUser: boolean }> {
  const accessToken = await requestGoogleAccessToken();
  const json = await googleAuth({
    accessToken,
    accountType: opts?.accountType,
  });

  if (!json.success) {
    throw new Error(json.message ?? json.error ?? 'Google sign-in failed.');
  }

  const token = pickAccessTokenFromPayload(json.data ?? {});
  if (!token) {
    throw new Error('Login failed — no token received.');
  }

  setAccessToken(token);
  const email = json.data?.user?.email;
  if (email) setSessionEmail(email);
  if (json.data?.user) {
    setSessionProfile({
      firstName: json.data.user.firstName,
      lastName: json.data.user.lastName,
      email: json.data.user.email,
      accountType: opts?.accountType,
    });
  }

  return { isNewUser: Boolean(json.data?.isNewUser) };
}
