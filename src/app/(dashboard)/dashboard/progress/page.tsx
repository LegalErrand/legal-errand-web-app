'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getQuestions, getQuestionStats, getFetchErrorMessage, getAccessToken } from '@/lib';
import type { Question, QuestionStats, SubjectMastery } from '@/lib';
import styles from './page.module.scss';

const SUBJECT_TABS = ['All question banks', 'Contract law', 'Criminal law', 'Tort law'] as const;
type SubjectTab = (typeof SUBJECT_TABS)[number];

const SUBJECT_PARAM: Record<SubjectTab, string | undefined> = {
  'All question banks': undefined,
  'Contract law': 'Contract law',
  'Criminal law': 'Criminal law',
  'Tort law': 'Tort law',
};

export default function ProgressPage() {
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
      setItems(res.data?.data ?? []);
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

  const masteryDisplay: SubjectMastery[] = stats?.subjectBreakdown
    ? Object.entries(stats.subjectBreakdown)
        .slice(0, 3)
        .map(([subject, data]) => ({ subject, score: Math.round(data.averageScore) }))
    : [];

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <div>
          <h1 className={styles.pageTitle}>Reasoning question bank</h1>
          <p className={styles.pageSub}>
            Master the art of legal reasoning through curated hypotheticals.
          </p>
        </div>
      </header>

      <div className={styles.content}>
        {/* Subject filter tabs */}
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

        {/* Subject mastery cards — only shown once the API returns real data */}
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

        {/* Question bank grid */}
        {loading ? (
          <p className={styles.stateMsg}>Loading questions…</p>
        ) : items.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No questions available for this subject yet. Check back soon.</p>
          </div>
        ) : (
          <div className={styles.questionGrid}>
            {items.map((item) => (
              <QuestionCard
                key={item.id}
                item={item}
                onStart={() => router.push(`/dashboard/quiz/${item.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniDonut({ score }: { score: number }) {
  const r = 22;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (Math.min(100, score) / 100) * circumference;
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
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 30 30)"
        />
      </svg>
      <span className={styles.miniDonutLabel} style={{ ['--donut-color' as string]: color }}>
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
      {item.difficulty && <p className={styles.qDesc}>Difficulty: {item.difficulty}</p>}
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
