'use client';

import { useEffect, useRef } from 'react';
import { COUNTRIES, detectCountry } from '@/lib';
import { SearchableSelect } from '../SearchableSelect';
import styles from './CountrySelect.module.scss';

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const COUNTRY_NAMES = COUNTRIES.map((c) => c.name);

export default function CountrySelect({ value, onChange, error }: CountrySelectProps) {
  const hasAutoDetected = useRef(false);

  useEffect(() => {
    if (hasAutoDetected.current || value) return;
    hasAutoDetected.current = true;

    detectCountry().then(({ name }) => {
      if (!name) return;
      const match = COUNTRIES.find((c) => c.name.toLowerCase() === name.toLowerCase());
      if (match) onChange(match.name);
    });
  }, [value, onChange]);

  return (
    <div className={styles.field}>
      <label>Country</label>
      <SearchableSelect
        value={value}
        onChange={onChange}
        options={COUNTRY_NAMES}
        placeholder="Select your country"
        searchPlaceholder="Search countries..."
        error={error}
      />
    </div>
  );
}
