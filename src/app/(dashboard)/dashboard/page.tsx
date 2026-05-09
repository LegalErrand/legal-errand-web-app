'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  getDashboard,
  getDashboardGoals,
  getRandomQuestion,
} from '@/lib/api';
import { getAccessToken } from '@/lib/authStorage';
import type { DashboardData, Goal, Question } from '@/lib/types';
import styles from './page.module.scss';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { router.replace('/login'); return; }

    void (async () => {
      try {
        const [dashRes, goalsRes, qRes] = await Promise.allSettled([
          getDashboard(token),
          getDashboardGoals(token),
          getRandomQuestion(token),
        ]);
        if (dashRes.status === 'fulfilled' && dashRes.value.data) {
          setData(dashRes.value.data);
        }
        if (goalsRes.status === 'fulfilled' && goalsRes.value.data) {
          setGoals(goalsRes.value.data);
        }
        if (qRes.status === 'fulfilled' && qRes.value.data) {
          setQuestion(qRes.value.data);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const firstName = data?.user?.firstName ?? '';
  const streak = data?.streak ?? 0;
  const mastery = data?.subjectMastery ?? [];
  const activity = data?.recentActivity ?? [];
  const nextGoal = goals.find((g) => !g.isCompleted) ?? null;

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>Loading dashboard…</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <form className={styles.searchWrap} onSubmit={(e) => {
          e.preventDefault();
          const q = searchQuery.trim();
          router.push(q ? `/dashboard/reasoning?q=${encodeURIComponent(q)}` : '/dashboard/reasoning');
        }}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8" />
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input ref={searchRef} className={styles.searchInput} type="text" placeholder="Ask LegalErrand AI a Legal Question"
            aria-label="Ask a legal question" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </form>
        <button className={styles.notifBtn} aria-label="Notifications">
          <Image src="/icons/notifications.svg" alt="" width={22} height={22} />
        </button>
      </header>

      <div className={styles.content}>
        <div className={styles.greetRow}>
          <div>
            <h1 className={styles.greeting}>Good Day{firstName ? `, ${firstName}` : ''}</h1>
            <p className={styles.greetSub}>Ready to Master Laws of the Federation today?</p>
          </div>
          {streak > 0 && (
            <div className={styles.streak}>
              <Image src="/icons/fire.svg" alt="Streak" width={28} height={28} />
              <div className={styles.streakText}>
                <span className={styles.streakLabel}>Study Streak</span>
                <span className={styles.streakDays}>{streak} {streak === 1 ? 'Day' : 'Days'}</span>
              </div>
            </div>
          )}
        </div>

        <div className={styles.challengeRow}>
          <div className={styles.challengeCard}>
            <div className={styles.challengeBadge}>
              <span className={styles.badgeDot}>TODAY&apos;S CHALLENGE</span>
              {question && (
                <span className={styles.badgeMeta}>
                  {question.difficulty} · {question.subject}
                </span>
              )}
            </div>
            {question ? (
              <>
                <h2 className={styles.challengeTitle}>{question.subject} Question</h2>
                <p className={styles.challengeSub}>{question.prompt ?? question.text ?? question.scenario ?? 'Test your legal knowledge with today\'s challenge.'}</p>
                <Link href="/dashboard/reasoning" className={styles.quizBtn}>Start Challenge</Link>
              </>
            ) : (
              <>
                <h2 className={styles.challengeTitle}>Daily Challenge</h2>
                <p className={styles.challengeSub}>No challenge available right now. Check back soon.</p>
              </>
            )}
          </div>

          {nextGoal ? (
            <div className={styles.nextCard}>
              <div className={styles.nextCardHeader}>
                <span className={styles.nextCardTitle}>Next Action</span>
              </div>
              <p className={styles.nextRecommend}>Active Goal</p>
              <p className={styles.nextItem}>{nextGoal.title}</p>
              {nextGoal.description && <p className={styles.nextDesc}>{nextGoal.description}</p>}
              <div className={styles.nextProgress}>
                <div className={styles.nextProgressTrack}>
                  <div className={styles.nextProgressFill} style={{ width: `${Math.min(100, Math.round((nextGoal.currentValue / nextGoal.targetValue) * 100))}%` }} />
                </div>
                <span className={styles.nextProgressPct}>
                  {Math.min(100, Math.round((nextGoal.currentValue / nextGoal.targetValue) * 100))}%
                </span>
              </div>
            </div>
          ) : (
            <div className={styles.nextCard}>
              <p className={styles.nextCardTitle}>No active goals yet.</p>
            </div>
          )}
        </div>

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
                      <div className={styles.masteryFill} style={{ width: `${Math.min(100, score)}%` }} />
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
                    <div className={`${styles.noteIcon} ${item.type === 'case_explainer' ? styles.noteIconCase : styles.noteIconDoc}`} aria-hidden="true">
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
                      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.emptyState}>No recent activity yet. Start learning!</p>
            )}
            <Link href="/dashboard/notes" className={styles.historyBtn}>View all notes →</Link>
          </section>
        </div>
      </div>
    </div>
  );
}
