'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { SparklesIcon, BellIcon } from '../icons';
import styles from './DashboardNavbar.module.scss';

export default function DashboardNavbar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/dashboard/ai?q=${encodeURIComponent(q)}` : '/dashboard/ai');
  };

  return (
    <header className={styles.navbar}>
      <form className={styles.searchBar} onSubmit={handleSearch}>
        <SparklesIcon size={18} className={styles.sparkleIcon} />
        <input
          type="text"
          placeholder="Ask LegalErrand AI Legal Question"
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </form>
      <div className={styles.actions}>
        <div className={styles.streakPill}>
          <span className={styles.fireIcon}>🔥</span>
          <span className={styles.streakText}>5 day streak</span>
        </div>
        <button className={styles.iconBtn}>
          <BellIcon size={20} />
        </button>
        <div className={styles.avatar}>
          <Image src="/icons/avatar.svg" alt="User" width={36} height={36} />
        </div>
      </div>
    </header>
  );
}
