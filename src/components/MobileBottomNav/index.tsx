'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getAccessToken, logout, clearAccessToken } from '@/lib';
import {
  HomeIcon,
  LibraryIcon,
  CasesIcon,
  NotesIcon,
  ResearchIcon,
  ReasoningIcon,
  ProgressIcon,
  SparklesIcon,
} from '../icons';
import styles from './MobileBottomNav.module.scss';

/** Primary tabs — mirrors the mobile design's 5-slot bar (centre slot is the AI FAB). */
const PRIMARY_ITEMS = [
  { label: 'Home', href: '/dashboard', Icon: HomeIcon },
  { label: 'Library', href: '/dashboard/library', Icon: LibraryIcon },
] as const;

const SECONDARY_ITEMS = [{ label: 'Cases', href: '/dashboard/cases', Icon: CasesIcon }] as const;

/** Routes that don't fit the bar live behind "More". */
const MORE_ITEMS = [
  { label: 'Notes', href: '/dashboard/notes', Icon: NotesIcon },
  { label: 'Research', href: '/dashboard/research', Icon: ResearchIcon },
  { label: 'Reasoning', href: '/dashboard/reasoning', Icon: ReasoningIcon },
  { label: 'Progress', href: '/dashboard/progress', Icon: ProgressIcon },
] as const;

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Close the sheet whenever the route changes.
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  // Lock body scroll while the sheet is open.
  useEffect(() => {
    if (!moreOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [moreOpen]);

  // Dismiss the sheet on Escape.
  useEffect(() => {
    if (!moreOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMoreOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  const moreIsActive = MORE_ITEMS.some((i) => isActive(i.href));

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    const token = getAccessToken();
    if (token) {
      try {
        await logout(token);
      } catch {
        /* best-effort — always clear locally */
      }
    }
    clearAccessToken();
    router.replace('/login');
  }

  return (
    <>
      <nav className={styles.bar} aria-label="Primary">
        {PRIMARY_ITEMS.map(({ label, href, Icon }) => (
          <Link
            key={href}
            href={href}
            className={`${styles.item} ${isActive(href) ? styles.itemActive : ''}`}
            aria-current={isActive(href) ? 'page' : undefined}
          >
            <Icon size={22} />
            {label}
          </Link>
        ))}

        <Link
          href="/dashboard/ai"
          className={`${styles.fabWrap} ${isActive('/dashboard/ai') ? styles.fabActive : ''}`}
          aria-current={isActive('/dashboard/ai') ? 'page' : undefined}
        >
          <span className={styles.fab}>
            <SparklesIcon size={22} />
          </span>
          Ask AI
        </Link>

        {SECONDARY_ITEMS.map(({ label, href, Icon }) => (
          <Link
            key={href}
            href={href}
            className={`${styles.item} ${isActive(href) ? styles.itemActive : ''}`}
            aria-current={isActive(href) ? 'page' : undefined}
          >
            <Icon size={22} />
            {label}
          </Link>
        ))}

        <button
          type="button"
          className={`${styles.item} ${moreIsActive ? styles.itemActive : ''}`}
          onClick={() => setMoreOpen(true)}
          aria-expanded={moreOpen}
          aria-haspopup="menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
          </svg>
          More
        </button>
      </nav>

      {moreOpen && (
        <>
          <button
            type="button"
            className={styles.overlay}
            onClick={() => setMoreOpen(false)}
            aria-label="Close menu"
          />
          <div className={styles.sheet} role="menu">
            <div className={styles.sheetHandle} />
            <p className={styles.sheetTitle}>More</p>
            {MORE_ITEMS.map(({ label, href, Icon }) => (
              <Link
                key={href}
                href={href}
                role="menuitem"
                className={`${styles.sheetLink} ${isActive(href) ? styles.sheetLinkActive : ''}`}
              >
                <Icon size={20} />
                {label}
              </Link>
            ))}
            <div className={styles.sheetDivider} />
            <button
              type="button"
              role="menuitem"
              className={styles.sheetLogout}
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M16 17l5-5-5-5M21 12H9M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {loggingOut ? 'Logging out…' : 'Log out'}
            </button>
          </div>
        </>
      )}
    </>
  );
}
