'use client';

import { useState } from 'react';
import {
  LEVELS,
  NIGERIAN_UNIVERSITIES,
  SPOTS_LEFT,
  validateWaitlistForm,
  submitWaitlist,
} from '@/lib';
import type { WaitlistFormData, WaitlistFormErrors } from '@/lib';
import { SearchableSelect } from '../SearchableSelect';
import FormField from '../FormField';
import CountrySelect from '../CountrySelect';
import SuccessModal from '../SuccessModal';
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
            label="First Name"
            id="firstName"
            name="firstName"
            placeholder="E.g Adebayo"
            value={form.firstName}
            onChange={handleChange}
            error={errors.firstName}
            autoComplete="given-name"
          />
          <FormField
            label="Email"
            id="email"
            name="email"
            type="email"
            placeholder="example@gmail.com"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            autoComplete="email"
          />
          <div className={styles.field}>
            <label htmlFor="universityName">University Name</label>
            <SearchableSelect
              value={form.universityName}
              onChange={(v) => setForm((prev) => ({ ...prev, universityName: v }))}
              options={NIGERIAN_UNIVERSITIES as unknown as string[]}
              placeholder="Select your university"
              searchPlaceholder="Search universities..."
              error={errors.universityName}
            />
          </div>
          <FormField
            label="Phone Number"
            id="phone"
            name="phone"
            type="tel"
            placeholder="+234 801 2345 678"
            value={form.phone}
            onChange={handleChange}
            error={errors.phone}
            autoComplete="tel"
          />

          <div className={styles.field}>
            <label htmlFor="level">Your level</label>
            <SearchableSelect
              value={form.level}
              onChange={(v) => setForm((prev) => ({ ...prev, level: v }))}
              options={LEVELS as unknown as string[]}
              placeholder="Select your level"
              searchPlaceholder="Search levels..."
              error={errors.level}
            />
          </div>

          <CountrySelect
            value={form.country}
            onChange={(val) => setForm((prev) => ({ ...prev, country: val }))}
            error={errors.country}
          />

          {apiError && (
            <p className={styles.apiError} role="alert">
              {apiError}
            </p>
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
