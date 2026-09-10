'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getQuestions,
  getQuestionStats,
  getFetchErrorMessage,
  getAccessToken,
  unwrapList,
  questionIdOf,
} from '@/lib';
import type { Question, QuestionStats, SubjectMastery } from '@/lib';
import { ShimmerCard } from '@/components';
import styles from './page.module.scss';

const SUBJECT_TABS = ['All question banks', 'Contract Law', 'Criminal Law', 'Tort Law'] as const;
type SubjectTab = (typeof SUBJECT_TABS)[number];

const SUBJECT_PARAM: Record<SubjectTab, string | undefined> = {
  'All question banks': undefined,
  'Contract Law': 'Contract Law',
  'Criminal Law': 'Criminal Law',
  'Tort Law': 'Tort Law',
};

function MiniDonut({ score }: { score: number }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, score) / 100) * circ;
  const color = score >= 80 ? '#16A34A' : score >= 50 ? '#D97706' : '#9CA3AF';
  return (
    <div className={styles.miniDonutWrap}>
      <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden="true">
        <circle cx="30" cy="30" r={r} fill="none" stroke="#F3F4F6" strokeWidth="6" />
        <circle
          cx="30"
          cy="30"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 30 30)"
        />
      </svg>
      <span className={styles.miniDonutLabel} style={{ color }}>
        {score}%
      </span>
    </div>
  );
}

function QuestionCard({ item, onStart }: { item: Question; onStart: () => void }) {
  const label = item.subject ?? 'General';
  const minutes = item.estimatedMinutes;
  return (
    <div className={styles.qCard}>
      <div className={styles.qCardTop}>
        <span className={styles.qCategory}>{label}</span>
        {minutes && <span className={styles.qTime}>{minutes}min</span>}
      </div>
      <h3 className={styles.qTitle}>{item.prompt ?? item.text ?? 'Practice Question'}</h3>
      {item.difficulty && <p className={styles.qDiff}>Difficulty: {item.difficulty}</p>}
      <button className={styles.startBtn} onClick={onStart}>
        Start practice
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5 12h14M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

function masteryFromStats(stats: QuestionStats | null): SubjectMastery[] {
  if (!stats) return [];
  if (stats.subjectBreakdown) {
    return Object.entries(stats.subjectBreakdown)
      .slice(0, 3)
      .map(([subject, data]) => ({ subject, score: Math.round(data.averageScore) }));
  }
  if (stats.bySubject) {
    return Object.entries(stats.bySubject)
      .slice(0, 3)
      .map(([subject, data]) => ({ subject, score: Math.round(data.avgScore) }));
  }
  return [];
}

export default function ReasoningPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [activeTab, setActiveTab] = useState<SubjectTab>('All question banks');
  const [items, setItems] = useState<Question[]>([]);
  const [stats, setStats] = useState<QuestionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadItems = useCallback(async (t: string, subject?: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await getQuestions(t, { subject, limit: 30 });
      setItems(unwrapList(res.data));
    } catch (err) {
      setError(getFetchErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = getAccessToken();
    if (!t) {
      router.replace('/login');
      return;
    }
    setToken(t);
    void Promise.allSettled([
      loadItems(t, undefined),
      getQuestionStats(t).then((r) => {
        if (r.data) setStats(r.data);
      }),
    ]);
  }, [router, loadItems]);

  function handleTabChange(tab: SubjectTab) {
    setActiveTab(tab);
    void loadItems(token, SUBJECT_PARAM[tab]);
  }

  const masteryDisplay = masteryFromStats(stats);

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <div>
          <h1 className={styles.pageTitle}>Reasoning question bank</h1>
          <p className={styles.pageSub}>
            Practice IRAC on curated Nigerian law hypotheticals — then submit for AI grading.
          </p>
        </div>
        <Link href="/dashboard/ai" className={styles.aiChatBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6H8.3A6.97 6.97 0 0 1 5 9a7 7 0 0 1 7-7Z"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M9 18v3M15 18v3M9 21h6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          AI Chat
        </Link>
      </header>

      <div className={styles.content}>
        <div className={styles.tabRow}>
          {SUBJECT_TABS.map((tab) => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => handleTabChange(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {masteryDisplay.length > 0 && (
          <div className={styles.masteryRow}>
            {masteryDisplay.map(({ subject, score }) => (
              <div key={subject} className={styles.masteryCard}>
                <p className={styles.masteryLabel}>SUBJECT MASTERY</p>
                <div className={styles.masteryScoreRow}>
                  <span className={styles.masterySubject}>{subject}</span>
                  <MiniDonut score={score} />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className={styles.errorMsg} role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <div className={styles.questionGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <ShimmerCard key={i} lines={2} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No questions available for this subject yet. Check back soon.</p>
          </div>
        ) : (
          <div className={styles.questionGrid}>
            {items.map((item) => {
              const qid = questionIdOf(item);
              return (
                <QuestionCard
                  key={qid || item.prompt}
                  item={item}
                  onStart={() => {
                    if (!qid) {
                      setError('This question is missing an id. Please refresh and try again.');
                      return;
                    }
                    router.push(`/dashboard/quiz/${qid}`);
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
