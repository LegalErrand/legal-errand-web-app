'use client';
import { useState, useRef, useEffect } from 'react';
import styles from './SearchableSelect.module.scss';

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  searchPlaceholder?: string;
  error?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  error,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  }

  const filtered = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  function select(option: string) {
    onChange(option);
    setOpen(false);
    setQuery('');
  }

  const triggerTextClass = value
    ? styles.triggerText
    : `${styles.triggerText} ${styles.triggerPlaceholder}`;

  const triggerClass = [
    styles.trigger,
    open ? styles.triggerOpen : '',
    error ? styles.triggerError : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={containerRef} className={styles.wrap} onKeyDown={handleKeyDown}>
      <button
        type="button"
        className={triggerClass}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={triggerTextClass}>{value || placeholder}</span>
        <span
          className={`${styles.chevron}${open ? ` ${styles.chevronUp}` : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className={styles.dropdown} role="listbox">
          <div className={styles.searchWrap}>
            <input
              ref={searchRef}
              type="text"
              className={styles.searchInput}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <ul className={styles.list}>
            {filtered.length === 0 ? (
              <li className={styles.noResult}>No results found</li>
            ) : (
              filtered.map((option) => (
                <li
                  key={option}
                  role="option"
                  aria-selected={option === value}
                  className={`${styles.option}${option === value ? ` ${styles.optionActive}` : ''}`}
                  onMouseDown={() => select(option)}
                >
                  {option}
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {error && (
        <span className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
