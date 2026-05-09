'use client';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword, getFetchErrorMessage } from '@/lib/api';
import styles from './page.module.scss';

function UpdatePasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const resetToken = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || password.length < 8) { setFormError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setFormError('Passwords do not match.'); return; }
    if (!resetToken) { setFormError('Reset token is missing. Please restart the reset process.'); return; }

    setLoading(true);
    setFormError('');
    try {
      const res = await resetPassword(resetToken, password);
      if (!res.success) { setFormError(res.message ?? res.error ?? 'Could not update password.'); return; }
      router.push('/login');
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
        <Image src="/images/forgot-password-image.png" alt="Student studying" fill className={styles.panelImg} priority />
      </div>

      <div className={styles.content}>
        <div className={styles.formWrap}>
          <h1 className={styles.heading}>Update Password</h1>
          <p className={styles.sub}>Create a new secure password for your account.</p>

          <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
            {formError && <p className={styles.formError} role="alert">{formError}</p>}

            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">New Password</label>
              <div className={styles.pwdWrap}>
                <input id="password" className={styles.input} type={showPwd ? 'text' : 'password'}
                  placeholder="Enter new password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" className={styles.showBtn} onClick={() => setShowPwd((p) => !p)}>
                  {showPwd ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="confirm">Confirm Password</label>
              <div className={styles.pwdWrap}>
                <input id="confirm" className={styles.input} type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                <button type="button" className={styles.showBtn} onClick={() => setShowConfirm((p) => !p)}>
                  {showConfirm ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>

          <p className={styles.footerLine}>
            Back to{' '}
            <Link href="/login" className={styles.footerLink}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function UpdatePasswordPage() {
  return (
    <Suspense>
      <UpdatePasswordContent />
    </Suspense>
  );
}
