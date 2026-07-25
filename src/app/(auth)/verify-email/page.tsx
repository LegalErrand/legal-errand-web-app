import { Suspense } from 'react';
import VerifyEmailClient from './VerifyEmailClient';
import { Spinner } from '@/components';
import styles from './page.module.scss';

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.page}>
          <Spinner size={24} />
        </div>
      }
    >
      <VerifyEmailClient />
    </Suspense>
  );
}
