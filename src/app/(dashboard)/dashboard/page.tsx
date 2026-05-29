'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getDashboard, getDashboardGoals, getRandomQuestion, getAchievements, getReasoningScore, getAccessToken } from "@/lib";
import type { DashboardData, Goal, Question, Achievement } from "@/lib";
import DashboardLower from '@/components/DashboardLower';
import ActivityHistoryModal from '@/components/ActivityHistoryModal';
import styles from './page.module.scss';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<Achievement[]>([]);
  const [reasoningScore, setReasoningScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { router.replace('/login'); return; }

    void (async () => {
      try {
        const [dashRes, goalsRes, qRes, achRes, rsRes] = await Promise.allSettled([
          getDashboard(token),
          getDashboardGoals(token),
          getRandomQuestion(token),
          getAchievements(token),
          getReasoningScore(token),
        ]);
        if (dashRes.status === 'fulfilled' && dashRes.value.data) setData(dashRes.value.data);
        if (goalsRes.status === 'fulfilled' && goalsRes.value.data) setGoals(goalsRes.value.data);
        if (qRes.status === 'fulfilled' && qRes.value.data) setQuestion(qRes.value.data);
        if (achRes.status === 'fulfilled' && achRes.value.data) {
          setEarnedBadges((achRes.value.data.badges ?? []).filter((b) => b.earned));
        }
        if (rsRes.status === 'fulfilled' && rsRes.value.data?.latest) {
          setReasoningScore(rsRes.value.data.latest.overall);
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
                  <div className={styles.nextProgressFill} style={{ ['--pct' as string]: `${Math.min(100, Math.round((nextGoal.currentValue / nextGoal.targetValue) * 100))}%` }} />
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

        <DashboardLower
          mastery={mastery}
          activity={activity}
          earnedBadges={earnedBadges}
          reasoningScore={reasoningScore}
          onViewHistory={() => setShowHistory(true)}
        />
      </div>
      {showHistory && <ActivityHistoryModal data={data} onClose={() => setShowHistory(false)} />}
    </div>
  );
}
