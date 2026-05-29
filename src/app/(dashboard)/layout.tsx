import type { ReactNode } from 'react';
import { DashboardSidebar } from "@/components";
import styles from './layout.module.scss';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <DashboardSidebar />
      <div className={styles.body}>{children}</div>
    </div>
  );
}
