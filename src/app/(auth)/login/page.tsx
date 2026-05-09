'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login, getFetchErrorMessage } from '@/lib/api';
import { setAccessToken, setSessionEmail, setSessionProfile, pickAccessTokenFromPayload } from '@/lib/authStorage';
import styles from './page.module.scss';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setFormError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setFormError('');
    try {
      const json = await login({ email: email.trim(), password });
      if (!json.success) {
        setFormError(json.message ?? json.error ?? 'Invalid email or password.');
        return;
      }
      const token = pickAccessTokenFromPayload(json.data ?? {});
      if (!token) { setFormError('Login failed — no token received.'); return; }
      setAccessToken(token);
      setSessionEmail(email.trim());
      if (json.data?.user) {
        setSessionProfile({ firstName: json.data.user.firstName, lastName: json.data.user.lastName, email: json.data.user.email });
      }
      router.push('/dashboard');
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
        <Image src="/images/login-image.png" alt="Student" fill className={styles.panelImg} priority />
      </div>

      <div className={styles.content}>
        <div className={styles.formWrap}>
          <h1 className={styles.heading}>Hey student Lawyer 👋</h1>
          <p className={styles.sub}>Welcome back! Sign in to continue your legal learning journey.</p>

          <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
            {formError && <p className={styles.formError} role="alert">{formError}</p>}

            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">Email Address</label>
              <input id="email" className={styles.input} type="email" placeholder="example@domain.com"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">Password</label>
              <div className={styles.pwdWrap}>
                <input id="password" className={styles.input} type={showPwd ? 'text' : 'password'}
                  placeholder="Enter your Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" className={styles.showBtn} onClick={() => setShowPwd((p) => !p)}>
                  {showPwd ? 'Hide' : 'Show'}
                </button>
              </div>
              <Link href="/forgot-password" className={styles.forgotLink}>Forgot Password?</Link>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign Back In'}
            </button>

            <div className={styles.orDivider}><span>Or</span></div>

            <button type="button" className={styles.socialBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in With Google
            </button>

            <button type="button" className={styles.socialBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.38c1.32.07 2.23.75 3 .8 1.16-.24 2.27-.93 3.52-.84 1.49.12 2.61.67 3.33 1.67-3.06 1.83-2.34 5.85.42 6.97-.61 1.59-1.42 3.17-2.27 4.3zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Sign in With Apple
            </button>
          </form>

          <p className={styles.footerLine}>
            I don&apos;t have an Account?{' '}
            <Link href="/signup" className={styles.footerLink}>Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
