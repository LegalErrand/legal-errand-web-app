'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  fetchAvatarDisplayUrl,
  getFetchErrorMessage,
  updateBioData,
  getAccessToken,
  getValidAccessToken,
  isAccessTokenExpired,
  clearAccessToken,
  getSessionEmail,
  getSessionProfile,
  validateBioDataFields,
  loginPath,
} from '@/lib';
import type { BioDataFormErrors } from '@/lib';
import BioDataCredentials from './BioDataCredentials';
import BioDataProfileCard from './BioDataProfileCard';
import styles from './page.module.scss';

export default function BioDataClient() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [sessionEmail, setSessionEmailState] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [school, setSchool] = useState('');
  const [phone, setPhone] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [editing, setEditing] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<BioDataFormErrors>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const raw = getAccessToken();
    if (!raw) {
      router.replace('/signup');
      return;
    }
    if (isAccessTokenExpired(raw)) {
      clearAccessToken();
      router.replace(loginPath('/bio-data'));
      return;
    }
    setToken(raw);
    setSessionEmailState(getSessionEmail() ?? '');
    const profile = getSessionProfile();
    setFirstName(profile.firstName ?? '');
    setLastName(profile.lastName ?? '');

    void (async () => {
      const url = await fetchAvatarDisplayUrl(raw);
      if (!cancelled && url) setAvatarUrl(url);
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) return;

    const errs = validateBioDataFields({
      country,
      city,
      schoolName: school,
      phoneDigits: phone,
    });
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    const t = getValidAccessToken();
    if (!t) {
      router.replace(loginPath('/bio-data'));
      return;
    }

    const digits = phone.replace(/\D/g, '').replace(/^0+/, '');
    const phoneNumber = `+234${digits}`;

    setSaving(true);
    setFormError('');
    try {
      const res = await updateBioData(
        {
          username: username.trim() || undefined,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          country,
          city,
          schoolName: school.trim(),
          phoneNumber,
        },
        t
      );
      if (!res.success) {
        setFormError(res.message ?? res.error ?? 'Could not save profile.');
        return;
      }
      router.push('/dashboard');
    } catch (err) {
      setFormError(getFetchErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (!token) {
    return null;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Image src="/logo.svg" alt="LegalErrand" width={152} height={34} priority />
        </div>
        <div className={styles.stepper}>
          <div className={styles.step}>
            <span className={styles.stepNum}>1</span>
            Account Verification
          </div>
          <div className={styles.stepDivider} />
          <div className={`${styles.step} ${styles.stepActive}`}>
            <span className={styles.stepNum}>2</span>
            Bio Data
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <BioDataProfileCard
            token={token}
            sessionEmail={sessionEmail}
            avatarUrl={avatarUrl}
            username={username}
            firstName={firstName}
            lastName={lastName}
            editing={editing}
            onAvatarSuccess={(url) => setAvatarUrl(url)}
            onToggleEditing={() => setEditing((e) => !e)}
            onUsernameChange={setUsername}
            onFirstNameChange={setFirstName}
            onLastNameChange={setLastName}
          />

          <BioDataCredentials
            country={country}
            city={city}
            school={school}
            phone={phone}
            fieldErrors={fieldErrors}
            onCountryChange={setCountry}
            onCityChange={setCity}
            onSchoolChange={setSchool}
            onPhoneChange={setPhone}
          />

          <div className={styles.formFooter}>
            {formError && (
              <p className={styles.formError} role="alert">
                {formError}
              </p>
            )}
            <label className={styles.agreeLabel}>
              <input
                type="checkbox"
                className={styles.agreeCheck}
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>
                I confirm that all details provided in this form are accurate, complete, and
                personally supplied by me.
              </span>
            </label>
            <button type="submit" className={styles.submitBtn} disabled={!agreed || saving}>
              {saving ? 'Saving…' : 'Save & Continue'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
