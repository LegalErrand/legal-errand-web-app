'use client';

import { useState } from 'react';
import styles from './WaitlistForm.module.scss';

const LEVELS = ['100 Level', '200 Level', '300 Level', '400 Level', '500 Level', 'Final Year'];
const TOTAL_SPOTS = 100;
const SPOTS_TAKEN = 40;

interface FormData {
  firstName: string;
  email: string;
  phone: string;
  level: string;
}

interface FormErrors {
  firstName?: string;
  email?: string;
  phone?: string;
  level?: string;
}

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.firstName.trim()) errors.firstName = 'First name is required';
  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Enter a valid email address';
  }
  if (!data.phone.trim()) errors.phone = 'Phone number is required';
  if (!data.level) errors.level = 'Please select your level';
  return errors;
}

export default function WaitlistForm() {
  const [form, setForm] = useState<FormData>({ firstName: '', email: '', phone: '', level: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const spotsLeft = TOTAL_SPOTS - SPOTS_TAKEN;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    // Simulated submission — wire to API later
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className={styles.card}>
        <div className={styles.success}>
          <div className={styles.successIcon}>🎉</div>
          <h3>You&apos;re on the list!</h3>
          <p>
            We&apos;ll notify you at <strong>{form.email}</strong> when early access opens.
            You&apos;re one of the founding members — expect something special.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <p className={styles.eyebrow}>Early Access Waitlist</p>
      <h2 className={styles.heading}>Get in before everyone else.</h2>
      {/* <p className={styles.subtext}>
        First {TOTAL_SPOTS} students get founding member access. Secure your spot.
      </p> */}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="firstName">First Name</label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            placeholder="E.g Adebayo"
            value={form.firstName}
            onChange={handleChange}
            autoComplete="given-name"
          />
          {errors.firstName && <span className={styles.error}>{errors.firstName}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="example@domain.com"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
          />
          {errors.email && <span className={styles.error}>{errors.email}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="phone">Phone Number</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+234 801 2345 678"
            value={form.phone}
            onChange={handleChange}
            autoComplete="tel"
          />
          {errors.phone && <span className={styles.error}>{errors.phone}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="level">Your Level</label>
          <div className={styles.selectWrapper}>
            <select
              id="level"
              name="level"
              value={form.level}
              onChange={handleChange}
              className={!form.level ? styles.placeholder : ''}
            >
              <option value="" disabled>Select your level</option>
              {LEVELS.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <span className={styles.chevron}>▼</span>
          </div>
          {errors.level && <span className={styles.error}>{errors.level}</span>}
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Securing your spot…' : 'Secure My Free Spot'}
        </button>
      </form>

      <hr className={styles.divider} />
      {/* <p className={styles.spotsLeft}>Only {spotsLeft} spots remaining</p> */}
    </div>
  );
}
