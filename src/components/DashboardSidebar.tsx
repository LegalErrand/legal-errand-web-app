'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { getCurrentUser } from '@/lib/api';
import { getAccessToken } from '@/lib/authStorage';
import styles from './DashboardSidebar.module.scss';

const NAV_ITEMS = [
  { label: 'Home',      href: '/dashboard',           icon: 'home' },
  { label: 'Library',   href: '/dashboard/library',   icon: 'library' },
  { label: 'Cases',     href: '/dashboard/cases',     icon: 'cases' },
  { label: 'Notes',     href: '/dashboard/notes',     icon: 'notes' },
  { label: 'Research',  href: '/dashboard/research',  icon: 'research' },
  { label: 'Reasoning', href: '/dashboard/reasoning', icon: 'reasoning' },
  { label: 'Progress',  href: '/dashboard/progress',  icon: 'progress' },
] as const;

function NavIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    home: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
    library: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
    cases: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2" y="7" width="20" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
    notes: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M14 3v6h6M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    research: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8" />
        <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    reasoning: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2a7 7 0 0 1 7 7c0 2.7-1.52 5.05-3.75 6.28L15 21H9l.75-5.72A7 7 0 0 1 5 9a7 7 0 0 1 7-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 21h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    progress: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  };
  return <>{icons[name] ?? null}</>;
}

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    void getCurrentUser(token).then((res) => {
      const u = res.data;
      if (u) {
        const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || u.email || '';
        setUserName(name);
      }
    }).catch(() => {});
  }, []);

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logoWrap}>
        <Image src="/logo.svg" alt="LegalErrand" width={140} height={32} priority />
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ label, href, icon }) => (
          <Link
            key={href}
            href={href}
            className={`${styles.navItem} ${isActive(href) ? styles.navActive : ''}`}
          >
            <NavIcon name={icon} />
            {label}
          </Link>
        ))}
      </nav>

      {/* User profile */}
      <div className={styles.userRow}>
        <div className={styles.userAvatar}>
          <Image src="/icons/avatar.svg" alt="User avatar" width={36} height={36} />
        </div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{userName || 'Student'}</span>
          <span className={styles.userRole}>Student</span>
        </div>
      </div>
    </aside>
  );
}
