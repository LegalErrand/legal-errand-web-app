'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getFetchErrorMessage,
  resendVerificationOtp,
  verifyEmail,
  clearPendingVerificationEmail,
  getPendingVerificationEmail,
  pickAccessTokenFromPayload,
  setAccessToken,
  setSessionEmail,
  setSessionProfile,
} from '@/lib';
import styles from './page.module.scss';

const OTP_LENGTH = 6;

export default function VerifyEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const q = searchParams.get('email')?.trim();
    const pending = getPendingVerificationEmail()?.trim();
    const resolved = q || pending || '';
    if (!resolved) {
      router.replace('/signup');
      return;
    }
    setEmail(resolved);
  }, [router, searchParams]);

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const digits = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH)
      .split('');
    const next = [...otp];
    digits.forEach((d, i) => {
      next[i] = d;
    });
    setOtp(next);
    const lastFilled = Math.min(digits.length, OTP_LENGTH - 1);
    inputRefs.current[lastFilled]?.focus();
  }

  async function handleResend() {
    if (!email) return;
    setError('');
    try {
      await resendVerificationOtp(email);
      setOtp(Array(OTP_LENGTH).fill(''));
      setResent(true);
      inputRefs.current[0]?.focus();
      setTimeout(() => setResent(false), 3000);
    } catch (err) {
      setError(getFetchErrorMessage(err));
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < OTP_LENGTH || !email) return;

    setLoading(true);
    setError('');
    try {
      const res = await verifyEmail({ email, otp: code });
      if (!res.success) {
        setError(res.message ?? res.error ?? 'Verification failed.');
        return;
      }
      const token = pickAccessTokenFromPayload(res.data);
      if (!token) {
        setError('Verification succeeded but no access token was returned.');
        return;
      }
      setAccessToken(token);
      const payload = res.data;
      if (payload?.user) {
        const u = payload.user;
        setSessionProfile({
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email ?? email,
        });
        setSessionEmail(u.email ?? email);
      } else {
        setSessionEmail(email);
      }
      clearPendingVerificationEmail();
      router.push('/bio-data');
    } catch (err) {
      setError(getFetchErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Image src="/logo.svg" alt="LegalErrand" width={152} height={34} priority />
        </div>
        <div className={styles.stepper}>
          <div className={`${styles.step} ${styles.stepActive}`}>
            <span className={styles.stepNum}>1</span>
            Account Verification
          </div>
          <div className={styles.stepDivider} />
          <div className={styles.step}>
            <span className={styles.stepNum}>2</span>
            Bio Data
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <h1 className={styles.heading}>6 Digit Otp code</h1>
        <p className={styles.sub}>
          We have sent a 6 digit otp code to your School Email Address, use this to Activate your
          account and verify your account.
        </p>

        {email && <p className={styles.emailHint}>{email}</p>}

        <form onSubmit={handleVerify}>
          <div className={styles.otpCard} onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                className={styles.otpBox}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                aria-label={`OTP digit ${i + 1}`}
                disabled={loading}
              />
            ))}
          </div>

          {error && (
            <p className={styles.errorAlert} role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className={styles.verifySubmit}
            disabled={loading || otp.join('').length < OTP_LENGTH}
          >
            {loading ? 'Verifying…' : 'Verify email'}
          </button>

          <div className={styles.footer}>
            <p className={styles.resendText}>
              {resent ? 'Code resent! Check your email.' : "I Didn't get 6 digit code"}
            </p>
            <button
              type="button"
              className={styles.resendBtn}
              onClick={handleResend}
              disabled={loading || !email}
            >
              Resend Code
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
