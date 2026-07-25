import styles from './Spinner.module.scss';

interface SpinnerProps {
  size?: number;
  label?: string;
  /** Use on dark/colored backgrounds (e.g. primary buttons). */
  light?: boolean;
}

export default function Spinner({ size = 20, label, light = false }: SpinnerProps) {
  return (
    <span
      className={`${styles.wrap}${light ? ` ${styles.light}` : ''}`}
      aria-label={label ?? 'Loading'}
      role="status"
    >
      <svg
        className={styles.svg}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle className={styles.track} cx="12" cy="12" r="10" strokeWidth="2.5" />
        <circle
          className={styles.arc}
          cx="12"
          cy="12"
          r="10"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {label && <span className={styles.label}>{label}</span>}
    </span>
  );
}
