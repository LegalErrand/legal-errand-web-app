'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  login,
  getFetchErrorMessage,
  setAccessToken,
  setSessionEmail,
  setSessionProfile,
  pickAccessTokenFromPayload,
  getValidAccessToken,
} from '@/lib';
import GoogleAuthButton from '@/components/GoogleAuthButton';
import styles from './page.module.scss';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (getValidAccessToken()) {
      router.replace('/dashboard');
    }
  }, [router]);

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
      if (!token) {
        setFormError('Login failed — no token received.');
        return;
      }
      setAccessToken(token);
      setSessionEmail(email.trim());
      if (json.data?.user) {
        setSessionProfile({
          firstName: json.data.user.firstName,
          lastName: json.data.user.lastName,
          email: json.data.user.email,
        });
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
        <Image
          src="/images/login-image.png"
          alt="Student"
          fill
          className={styles.panelImg}
          priority
        />
      </div>

      <div className={styles.content}>
        <div className={styles.formWrap}>
          <h1 className={styles.heading}>Hey student Lawyer 👋</h1>
          <p className={styles.sub}>
            Welcome back! Sign in to continue your legal learning journey.
          </p>

          <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
            {formError && (
              <p className={styles.formError} role="alert">
                {formError}
              </p>
            )}

            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">
                Email Address
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

            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">
                Password
              </label>
              <div className={styles.pwdWrap}>
                <input
                  id="password"
                  className={styles.input}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Enter your Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.showBtn}
                  onClick={() => setShowPwd((p) => !p)}
                >
                  {showPwd ? 'Hide' : 'Show'}
                </button>
              </div>
              <Link href="/forgot-password" className={styles.forgotLink}>
                Forgot Password?
              </Link>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign Back In'}
            </button>

            <div className={styles.orDivider}>
              <span>Or</span>
            </div>

            <GoogleAuthButton
              label="Sign in With Google"
              disabled={loading}
              onError={setFormError}
            />

            <p className={styles.legalLine}>
              By continuing with Google, you agree to our{' '}
              <Link href="/terms-of-use">Terms of Use</Link> and{' '}
              <Link href="/privacy">Privacy Policy</Link>.
            </p>
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
