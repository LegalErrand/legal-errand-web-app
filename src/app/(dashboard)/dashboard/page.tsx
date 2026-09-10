'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  getDashboard,
  getDashboardGoals,
  getRandomQuestion,
  getAchievements,
  getReasoningScore,
  getCurrentUser,
  getAccessToken,
} from '@/lib';
import type { DashboardData, Goal, Question, Achievement, SubjectMastery } from '@/lib';
import DashboardLower from '@/components/DashboardLower';
import ActivityHistoryModal from '@/components/ActivityHistoryModal';
import { Spinner } from '@/components';
import styles from './page.module.scss';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<Achievement[]>([]);
  const [reasoningScore, setReasoningScore] = useState<number | null>(null);
  const [firstName, setFirstName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    void (async () => {
      try {
        const [dashRes, goalsRes, qRes, achRes, rsRes, meRes] = await Promise.allSettled([
          getDashboard(token),
          getDashboardGoals(token),
          getRandomQuestion(token),
          getAchievements(token),
          getReasoningScore(token),
          getCurrentUser(token),
        ]);
        if (dashRes.status === 'fulfilled' && dashRes.value.data) setData(dashRes.value.data);
        // `/dashboard` carries no profile — the name comes from `/auth/me`.
        if (meRes.status === 'fulfilled' && meRes.value.data) {
          setFirstName(meRes.value.data.firstName ?? '');
        }
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

  const streak = data?.streak?.current ?? 0;
  const mastery: SubjectMastery[] = (() => {
    const raw = data?.subjectMastery;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') {
      return Object.entries(raw as Record<string, number>).map(([subject, score]) => ({
        subject,
        score: Number(score) || 0,
      }));
    }
    return [];
  })();
  const nextGoal = goals.find((g) => !g.isCompleted) ?? null;

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <Spinner size={28} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
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
                <span className={styles.streakDays}>
                  {streak} {streak === 1 ? 'Day' : 'Days'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className={styles.challengeRow}>
          <div className={styles.challengeCard}>
            <div className={styles.challengeBadge}>
              <span className={styles.badgeDot}>TODAY&apos;S CHALLENGE</span>
              {question && <span className={styles.badgeMeta}>• 15 Mins • 10 Questions</span>}
            </div>
            {question ? (
              <>
                <h2 className={styles.challengeTitle}>Daily Quiz: {question.subject}</h2>
                <p className={styles.challengeSub}>
                  {question.prompt ??
                    question.text ??
                    question.scenario ??
                    "Test your legal knowledge with today's challenge."}
                </p>
                <Link
                  href={`/dashboard/quiz/${question.id || question._id}`}
                  className={styles.quizBtn}
                >
                  Start Quiz
                </Link>
              </>
            ) : (
              <>
                <h2 className={styles.challengeTitle}>Daily Quiz</h2>
                <p className={styles.challengeSub}>
                  Test your legal reasoning with questions from the question bank.
                </p>
                <Link href="/dashboard/reasoning" className={styles.quizBtn}>
                  Browse Questions
                </Link>
              </>
            )}
          </div>

          <div className={styles.quickActionCard}>
            <h3 className={styles.quickActionTitle}>Quick Action</h3>
            <div className={styles.quickActionList}>
              <Link href="/dashboard/reasoning" className={styles.quickActionBtn}>
                <span className={styles.quickActionIconCase}>⚖</span> Explain a New Case
              </Link>
              <Link href="/dashboard/research" className={styles.quickActionBtn}>
                <span className={styles.quickActionIconResearch}>🔍</span> Search new research
              </Link>
              <Link href="/dashboard/notes" className={styles.quickActionBtn}>
                <span className={styles.quickActionIconNote}>+</span> Create new note
              </Link>
            </div>
          </div>
        </div>

        <DashboardLower
          mastery={mastery}
          earnedBadges={earnedBadges}
          reasoningScore={reasoningScore}
          onViewHistory={() => setShowHistory(true)}
        />
      </div>
      {showHistory && <ActivityHistoryModal data={data} onClose={() => setShowHistory(false)} />}
    </div>
  );
}
