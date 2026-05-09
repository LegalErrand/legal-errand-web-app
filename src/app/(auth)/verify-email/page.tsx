import { Suspense } from 'react';
import VerifyEmailClient from './VerifyEmailClient';
import styles from './page.module.scss';

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.page}>
          <p className={styles.sub}>Loading…</p>
        </div>
      }
    >
      <VerifyEmailClient />
    </Suspense>
  );
}
