'use client';

import { useEffect, useRef } from 'react';
import { COUNTRIES } from '@/lib/constants';
import { detectCountry } from '@/lib/geo';
import styles from './CountrySelect.module.scss';

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export default function CountrySelect({ value, onChange, error }: CountrySelectProps) {
  const hasAutoDetected = useRef(false);

  useEffect(() => {
    if (hasAutoDetected.current || value) return;
    hasAutoDetected.current = true;

    detectCountry().then(({ name }) => {
      if (!name) return;
      const match = COUNTRIES.find(
        (c) => c.name.toLowerCase() === name.toLowerCase()
      );
      if (match) onChange(match.name);
    });
  }, [value, onChange]);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange(e.target.value);
  }

  return (
    <div className={styles.field}>
      <label htmlFor="country">Country</label>
      <div className={styles.selectWrapper}>
        <select
          id="country"
          name="country"
          value={value}
          onChange={handleChange}
          className={!value ? styles.placeholder : ''}
          aria-describedby={error ? 'country-error' : undefined}
          aria-invalid={!!error}
        >
          <option value="" disabled>Select your country</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <span className={styles.chevron} aria-hidden="true">▼</span>
      </div>
      {error && (
        <span id="country-error" className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
