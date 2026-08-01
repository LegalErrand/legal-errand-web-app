import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AuthGuard, DashboardSidebar, DashboardNavbar, MobileBottomNav } from '@/components';
import styles from './layout.module.scss';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className={styles.shell}>
        <DashboardSidebar />
        <div className={styles.body}>
          <DashboardNavbar />
          {children}
        </div>
        <MobileBottomNav />
      </div>
    </AuthGuard>
  );
}
