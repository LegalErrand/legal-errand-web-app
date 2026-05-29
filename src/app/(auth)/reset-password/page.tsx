'use client';

import { useRef, useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyOtp, resendVerificationOtp, getFetchErrorMessage } from "@/lib";
import styles from './page.module.scss';

function ResetPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') ?? '';

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [formError, setFormError] = useState('');
  const [resendMsg, setResendMsg] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleDigitChange(index: number, value: string) {
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    if (cleaned && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length < 6) { setFormError('Please enter all 6 digits.'); return; }
    setLoading(true);
    setFormError('');
    try {
      const res = await verifyOtp(email, otp);
      if (!res.data?.resetToken) { setFormError(res.message ?? 'Invalid OTP. Please try again.'); return; }
      router.push(`/update-password?token=${encodeURIComponent(res.data.resetToken)}`);
    } catch (err) {
      setFormError(getFetchErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) return;
    setResending(true);
    setResendMsg('');
    setFormError('');
    try {
      await resendVerificationOtp(email);
      setResendMsg('A new code has been sent to your email.');
    } catch (err) {
      setFormError(getFetchErrorMessage(err));
    } finally {
      setResending(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.panelLogo}>
          <Image src="/logo.svg" alt="LegalErrand" width={152} height={34} priority />
        </div>
        <Image src="/images/forgot-password-image.png" alt="Student studying" fill className={styles.panelImg} priority />
      </div>

      <div className={styles.content}>
        <div className={styles.formWrap}>
          <h1 className={styles.heading}>Reset your password</h1>
          <div className={styles.otpSection}>
            <h2 className={styles.otpTitle}>6 Digit OTP code</h2>
            <p className={styles.sub}>
              We have sent a 6-digit otp code to your Email, we are using this to verify
              it&apos;s you, before credentials can be reset.
            </p>
          </div>

          <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
            {formError && <p className={styles.formError} role="alert">{formError}</p>}
            {resendMsg && <p className={styles.successMsg}>{resendMsg}</p>}

            <div className={styles.otpRow} onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  className={styles.otpBox}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  aria-label={`OTP digit ${i + 1}`}
                />
              ))}
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading || digits.join('').length < 6}>
              {loading ? 'Verifying…' : 'Verify Code'}
            </button>
          </form>

          <div className={styles.resendRow}>
            <span className={styles.resendText}>I Didn&apos;t get 6 digit code</span>
            <button className={styles.resendBtn} onClick={handleResend} disabled={resending}>
              {resending ? 'Sending…' : 'Resend Code ›'}
            </button>
          </div>

          <p className={styles.footerLine}>
            Back to{' '}
            <Link href="/login" className={styles.footerLink}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
