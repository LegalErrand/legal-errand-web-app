'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  register,
  getFetchErrorMessage,
  setPendingVerificationEmail,
  setSessionEmail,
  setSessionProfile,
  validateSignupFields,
} from '@/lib';
import { GoogleAuthButton } from '@/components';
import styles from './page.module.scss';

type AccountType = 'undergraduate' | 'law-school';

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>('undergraduate');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = validateSignupFields({ firstName, lastName, email, password });
    const mapped: Record<string, string> = { ...next };
    setErrors(mapped);
    if (Object.keys(next).length) return;

    setLoading(true);
    setFormError('');
    try {
      const res = await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        accountType: accountType === 'undergraduate' ? 'Undergraduate' : 'Law School Student',
      });
      if (!res.success) {
        setFormError(res.message ?? res.error ?? 'Registration failed.');
        return;
      }
      const trimmed = email.trim();
      setPendingVerificationEmail(trimmed);
      setSessionEmail(trimmed);
      setSessionProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: trimmed,
        accountType: accountType === 'undergraduate' ? 'Undergraduate' : 'Law School Student',
      });
      router.push(`/verify-email?email=${encodeURIComponent(trimmed)}`);
    } catch (err) {
      setFormError(getFetchErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      {/* Left panel */}
      <div className={styles.panel}>
        <div className={styles.panelLogo}>
          <Image src="/logo.svg" alt="LegalErrand" width={152} height={34} priority />
        </div>
        <Image
          src="/images/onboarding-image.png"
          alt="Student studying"
          fill
          className={styles.panelImg}
          priority
        />
      </div>

      {/* Right panel */}
      <div className={styles.content}>
        <div className={styles.formWrap}>
          <h1 className={styles.heading}>Create Account</h1>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {formError && (
              <p className={styles.formError} role="alert">
                {formError}
              </p>
            )}
            {/* Name row */}
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="firstName">
                  Firstname
                </label>
                <input
                  id="firstName"
                  className={`${styles.input} ${errors.firstName ? styles.inputErr : ''}`}
                  type="text"
                  placeholder="E.g Adekaye"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                {errors.firstName && <span className={styles.errMsg}>{errors.firstName}</span>}
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="lastName">
                  Lastname
                </label>
                <input
                  id="lastName"
                  className={`${styles.input} ${errors.lastName ? styles.inputErr : ''}`}
                  type="text"
                  placeholder="Ajala"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
                {errors.lastName && <span className={styles.errMsg}>{errors.lastName}</span>}
              </div>
            </div>

            {/* Email */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                className={`${styles.input} ${errors.email ? styles.inputErr : ''}`}
                type="email"
                placeholder="E.g example@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <span className={styles.errMsg}>{errors.email}</span>}
            </div>

            {/* Password */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">
                Password
              </label>
              <div className={styles.pwdWrap}>
                <input
                  id="password"
                  className={`${styles.input} ${errors.password ? styles.inputErr : ''}`}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Set a Password of your Choice"
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
              {errors.password && <span className={styles.errMsg}>{errors.password}</span>}
            </div>

            {/* Account type */}
            <div className={styles.field}>
              <span className={styles.label}>Account type</span>
              <div className={styles.checkGroup}>
                <label className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={accountType === 'undergraduate'}
                    onChange={() => setAccountType('undergraduate')}
                  />
                  Undergraduate
                </label>
                <label className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={accountType === 'law-school'}
                    onChange={() => setAccountType('law-school')}
                  />
                  Law School Student
                </label>
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Please wait…' : 'Continue'}
            </button>

            <div className={styles.orDivider}>
              <span>Or</span>
            </div>

            <GoogleAuthButton
              label="Sign up With Google"
              accountType={accountType === 'undergraduate' ? 'Undergraduate' : 'Law School Student'}
              disabled={loading}
              onError={setFormError}
            />
          </form>

          <p className={styles.loginLine}>
            I already have an Account{' '}
            <Link href="/login" className={styles.loginLink}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
