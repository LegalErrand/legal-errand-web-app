'use client';
import { useState } from 'react';
import type { DashboardData } from '@/lib';
import mStyles from './ActivityHistoryModal.module.scss';
import lStyles from './ActivityList.module.scss';
const styles = { ...mStyles, ...lStyles };

type FilterTab = 'All' | 'Quizzes' | 'AI Sessions' | 'Document';

interface Props {
  data: DashboardData | null;
  onClose: () => void;
}

export default function ActivityHistoryModal({ data, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');
  const FILTERS: FilterTab[] = ['All', 'Quizzes', 'AI Sessions', 'Document'];
  const activity = data?.recentActivity ?? [];

  const filtered = activity.filter((item) => {
    const matchesSearch =
      !search || (item.title ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      activeFilter === 'All' ||
      (item.type ?? '').toLowerCase().includes(activeFilter.toLowerCase().replace(' ', '_'));
    return matchesSearch && matchesFilter;
  });

  const weeklyHours = data?.streak ? (data.streak * 1.5).toFixed(1) : '0';
  const topSubject = data?.subjectMastery?.[0]?.subject ?? '—';
  const quizzesCompleted = data?.recentActivity?.filter((a) => a.type === 'quiz')?.length ?? 0;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Activity History</h2>
            <p className={styles.subtitle}>Track your learning journey and mastery levels</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <p className={styles.statLabel}>Weekly study hours</p>
            <p className={styles.statValue}>
              {weeklyHours} <span className={styles.statUnit}>hrs</span>
            </p>
          </div>
          <div className={styles.statCard}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 2l3 7h7l-5.5 4 2 7L12 17l-6.5 3 2-7L2 9h7l3-7z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            <p className={styles.statLabel}>Top Subject</p>
            <p className={styles.statValue}>{topSubject}</p>
            <span className={styles.topBadge}>Top performer</span>
          </div>
          <div className={styles.statCard}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <rect
                x="9"
                y="3"
                width="6"
                height="4"
                rx="1"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>
            <p className={styles.statLabel}>Quizzes Completed</p>
            <p className={styles.statValue}>{quizzesCompleted}</p>
          </div>
        </div>

        <div className={styles.filterBar}>
          <div className={styles.searchWrap}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8" />
              <path
                d="M21 21l-4.35-4.35"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            <input
              className={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activities, topic, quiz...."
            />
          </div>
          <div className={styles.filterTabs}>
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`${styles.filterTab} ${activeFilter === f ? styles.filterTabActive : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <ul className={styles.activityList}>
          {filtered.length === 0 ? (
            <li className={styles.emptyItem}>No activity found.</li>
          ) : (
            filtered.map((item, i) => (
              <li key={i} className={styles.activityItem}>
                <div className={styles.activityIcon} aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className={styles.activityBody}>
                  <p className={styles.activityTitle}>{item.title ?? 'Untitled'}</p>
                  <p className={styles.activityMeta}>
                    {item.createdAt
                      ? `Viewed ${new Date(item.createdAt).toLocaleDateString()}`
                      : 'Recently'}{' '}
                    · {item.type ?? 'Activity'}
                  </p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M9 18l6-6-6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
