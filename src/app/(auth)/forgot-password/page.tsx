'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { forgotPassword, getFetchErrorMessage } from '@/lib';
import styles from './page.module.scss';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setFormError('Please enter your email address.');
      return;
    }
    setLoading(true);
    setFormError('');
    try {
      const res = await forgotPassword(email.trim());
      if (!res.success) {
        setFormError(res.message ?? res.error ?? 'Could not send reset link.');
        return;
      }
      router.push(`/reset-password?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      setFormError(getFetchErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.panelLogo}>
          <Image src="/logo.svg" alt="LegalErrand" width={152} height={34} priority />
        </div>
        <Image
          src="/images/forgot-password-image.png"
          alt="Student studying"
          fill
          className={styles.panelImg}
          priority
        />
      </div>

      <div className={styles.content}>
        <div className={styles.formWrap}>
          <h1 className={styles.heading}>Forgot Password?</h1>
          <p className={styles.sub}>
            Hi there, not too worry — we can help you recover your password.
          </p>

          <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
            {formError && (
              <p className={styles.formError} role="alert">
                {formError}
              </p>
            )}

            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">
                Enter Registered Email
              </label>
              <input
                id="email"
                className={styles.input}
                type="email"
                placeholder="example@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Sending…' : 'Send Reset Request'}
            </button>
          </form>

          <p className={styles.footerLine}>
            I don&apos;t have an Account?{' '}
            <Link href="/signup" className={styles.footerLink}>
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
