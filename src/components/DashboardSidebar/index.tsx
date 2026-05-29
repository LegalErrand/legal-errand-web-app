'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { getCurrentUser, fetchAvatarDisplayUrl, getAccessToken } from "@/lib";
import {
  HomeIcon, LibraryIcon, CasesIcon, NotesIcon,
  ResearchIcon, ReasoningIcon, ProgressIcon,
} from '../icons';
import styles from './DashboardSidebar.module.scss';

const NAV_ITEMS = [
  { label: 'Home',      href: '/dashboard',           Icon: HomeIcon },
  { label: 'Library',   href: '/dashboard/library',   Icon: LibraryIcon },
  { label: 'Cases',     href: '/dashboard/cases',     Icon: CasesIcon },
  { label: 'Notes',     href: '/dashboard/notes',     Icon: NotesIcon },
  { label: 'Research',  href: '/dashboard/research',  Icon: ResearchIcon },
  { label: 'Reasoning', href: '/dashboard/reasoning', Icon: ReasoningIcon },
  { label: 'Progress',  href: '/dashboard/progress',  Icon: ProgressIcon },
] as const;

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [avatarSrc, setAvatarSrc] = useState('/icons/avatar.svg');

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    void Promise.allSettled([
      getCurrentUser(token).then((res) => {
        const u = res.data;
        if (u) {
          const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || u.email || '';
          setUserName(name);
          if (u.role) setUserRole(u.role);
          if (u.avatar) setAvatarSrc(u.avatar);
        }
      }),
      fetchAvatarDisplayUrl(token).then((url) => { if (url) setAvatarSrc(url); }),
    ]);
  }, []);

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoWrap}>
        <Image src="/logo.svg" alt="LegalErrand" width={140} height={32} priority />
      </div>
      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ label, href, Icon }) => (
          <Link
            key={href}
            href={href}
            className={`${styles.navItem} ${isActive(href) ? styles.navActive : ''}`}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
      <div className={styles.userRow}>
        <div className={styles.userAvatar}>
          <Image src={avatarSrc} alt="User avatar" width={36} height={36} />
        </div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{userName || '…'}</span>
          {userRole && <span className={styles.userRole}>{userRole}</span>}
        </div>
      </div>
    </aside>
  );
}
