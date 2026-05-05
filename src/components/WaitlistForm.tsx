'use client';

import { useState } from 'react';
import { LEVELS, SPOTS_LEFT } from '@/lib/constants';
import { validateWaitlistForm } from '@/lib/validation';
import { submitWaitlist } from '@/lib/api';
import type { WaitlistFormData, WaitlistFormErrors } from '@/lib/types';
import FormField from './FormField';
import CountrySelect from './CountrySelect';
import SuccessModal from './SuccessModal';
import styles from './WaitlistForm.module.scss';

const INITIAL_FORM: WaitlistFormData = {
  firstName: '',
  email: '',
  universityName: '',
  phone: '',
  level: '',
  country: '',
};

export default function WaitlistForm() {
  const [form, setForm] = useState<WaitlistFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<WaitlistFormErrors>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof WaitlistFormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateWaitlistForm(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setApiError('');
    setLoading(true);
    try {
      await submitWaitlist(form);
      setSubmitted(true);
    } catch {
      setApiError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className={styles.card}>
        <p className={styles.eyebrow}>Early Access Waitlist</p>
        <h2 className={styles.heading}>Get in before everyone else.</h2>
        <p className={styles.subtext}>
          First 100 students get founding member access. Secure your spot.
        </p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <FormField
            label="First Name" id="firstName" name="firstName"
            placeholder="E.g Adebayo" value={form.firstName}
            onChange={handleChange} error={errors.firstName}
            autoComplete="given-name"
          />
          <FormField
            label="Email" id="email" name="email" type="email"
            placeholder="example@gmail.com" value={form.email}
            onChange={handleChange} error={errors.email}
            autoComplete="email"
          />
          <FormField
            label="University Name" id="universityName" name="universityName"
            placeholder="State your university name" value={form.universityName}
            onChange={handleChange} error={errors.universityName}
            autoComplete="organization"
          />
          <FormField
            label="Phone Number" id="phone" name="phone" type="tel"
            placeholder="+234 801 2345 678" value={form.phone}
            onChange={handleChange} error={errors.phone}
            autoComplete="tel"
          />

          <div className={styles.field}>
            <label htmlFor="level">Your level</label>
            <div className={styles.selectWrapper}>
              <select
                id="level" name="level" value={form.level}
                onChange={handleChange}
                className={!form.level ? styles.placeholder : ''}
                aria-invalid={!!errors.level}
              >
                <option value="" disabled>Select your level</option>
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <span className={styles.chevron} aria-hidden="true">▼</span>
            </div>
            {errors.level && <span className={styles.error} role="alert">{errors.level}</span>}
          </div>

          <CountrySelect
            value={form.country}
            onChange={(val) => setForm((prev) => ({ ...prev, country: val }))}
            error={errors.country}
          />

          {apiError && (
            <p className={styles.apiError} role="alert">{apiError}</p>
          )}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Securing your spot…' : 'Secure My Free Spot'}
          </button>
        </form>

        <hr className={styles.divider} />
        <p className={styles.spotsLeft}>Only {SPOTS_LEFT} spots remaining</p>
      </div>

      {submitted && <SuccessModal onClose={() => setSubmitted(false)} />}
    </>
  );
}
