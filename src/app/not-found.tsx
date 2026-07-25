import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './not-found.module.scss';

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <span className={styles.code}>404</span>
        <h1 className={styles.title}>Page not found</h1>
        <p className={styles.sub}>
          This page doesn&apos;t exist or has been moved. Check the URL or head back to your
          dashboard.
        </p>
        <div className={styles.actions}>
          <Link href="/dashboard" className={styles.primaryBtn}>
            Go to Dashboard
          </Link>
          <Link href="/" className={styles.ghostBtn}>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
