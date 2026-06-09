'use client';

import Link from 'next/link';
import type { SubjectMastery, ActivityItem, Achievement } from '@/lib/types';
import styles from './DashboardLower.module.scss';

interface Props {
  mastery: SubjectMastery[];
  activity: ActivityItem[];
  earnedBadges: Achievement[];
  reasoningScore: number | null;
  onViewHistory?: () => void;
}

export default function DashboardLower({
  mastery,
  activity,
  earnedBadges,
  reasoningScore,
  onViewHistory,
}: Props) {
  return (
    <>
      {/* Reasoning score + achievements strip */}
      {(reasoningScore !== null || earnedBadges.length > 0) && (
        <div className={styles.statsStrip}>
          {reasoningScore !== null && (
            <div className={styles.statPill}>
              <span className={styles.statPillValue}>{reasoningScore}</span>
              <span className={styles.statPillLabel}>Reasoning Score</span>
            </div>
          )}
          {earnedBadges.length > 0 && (
            <div className={styles.statPill}>
              <span className={styles.statPillValue}>{earnedBadges.length}</span>
              <span className={styles.statPillLabel}>Badges Earned</span>
            </div>
          )}
          {earnedBadges.slice(0, 4).map((b) => (
            <span key={b.id} className={styles.badge} title={b.name}>
              {b.category === 'streak'
                ? '🔥'
                : b.category === 'quiz'
                  ? '📝'
                  : b.category === 'research'
                    ? '🔍'
                    : b.category === 'special'
                      ? '⭐'
                      : '🏅'}
            </span>
          ))}
          {earnedBadges.length > 4 && (
            <span className={styles.badgeMore}>+{earnedBadges.length - 4} more</span>
          )}
        </div>
      )}

      <div className={styles.lowerGrid}>
        <section className={styles.masteryCard}>
          <div className={styles.masteryHeader}>
            <span className={styles.cardTitle}>Subject Mastery</span>
          </div>
          {mastery.length > 0 ? (
            <div className={styles.masteryList}>
              {mastery.map(({ subject, score }) => (
                <div key={subject} className={styles.masteryRow}>
                  <span className={styles.masteryName}>{subject}</span>
                  <div className={styles.masteryTrack}>
                    <div
                      className={styles.masteryFill}
                      style={{ ['--pct' as string]: `${Math.min(100, score)}%` }}
                    />
                  </div>
                  <span className={styles.masteryPct}>{Math.min(100, score)}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyState}>Complete quizzes to see your subject mastery.</p>
          )}
        </section>

        <section className={styles.notesCard}>
          <div className={styles.notesHeader}>
            <span className={styles.cardTitle}>Recent Activity</span>
          </div>
          {activity.length > 0 ? (
            <ul className={styles.notesList}>
              {activity.slice(0, 5).map((item) => (
                <li key={item.id} className={styles.noteItem}>
                  <div
                    className={`${styles.noteIcon} ${item.type === 'case_explainer' ? styles.noteIconCase : styles.noteIconDoc}`}
                    aria-hidden="true"
                  >
                    {item.type === 'case_explainer' ? '⚖' : '📄'}
                  </div>
                  <div className={styles.noteBody}>
                    <p className={styles.noteTitle}>{item.title}</p>
                    <p className={styles.noteMeta}>
                      {item.subject && `${item.subject} · `}
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M9 18l6-6-6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.emptyState}>No recent activity yet. Start learning!</p>
          )}
          <div className={styles.noteFooter}>
            <Link href="/dashboard/notes" className={styles.historyBtn}>
              View all notes →
            </Link>
            <button type="button" className={styles.viewHistoryBtn} onClick={onViewHistory}>
              View Activity History
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
