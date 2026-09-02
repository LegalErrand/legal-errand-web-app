import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './legal.module.scss';

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logoLink} aria-label="LegalErrand home">
            <Image src="/logo.svg" alt="LegalErrand" width={148} height={34} priority />
          </Link>
          <nav className={styles.headerNav} aria-label="Legal documents">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms-of-use">Terms of Use</Link>
          </nav>
          <div className={styles.headerActions}>
            <Link href="/login" className={styles.loginBtn}>
              Log in
            </Link>
            <Link href="/signup" className={styles.ctaBtn}>
              Get Started
            </Link>
          </div>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <p>© 2026 LegalErrand. All rights reserved.</p>
        <nav aria-label="Legal">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms-of-use">Terms of Use</Link>
        </nav>
      </footer>
    </div>
  );
}
