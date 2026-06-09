'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { explainCase, getCaseExplainerHistory, getFetchErrorMessage, getAccessToken } from '@/lib';
import type { CaseHistoryItem, ExplainCaseRequest } from '@/lib';
import styles from './page.module.scss';

export default function CasesPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [citation, setCitation] = useState('');
  const [caseText, setCaseText] = useState('');
  const [inputMode, setInputMode] = useState<'citation' | 'text'>('citation');
  const [history, setHistory] = useState<CaseHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = getAccessToken();
    if (!t) {
      router.replace('/login');
      return;
    }
    setToken(t);
    void loadHistory(t);
  }, [router]);

  async function loadHistory(t: string) {
    setHistoryLoading(true);
    try {
      const res = await getCaseExplainerHistory(t, { limit: 20 });
      setHistory(res.data?.data ?? []);
    } catch {
      /* silent */
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleExplain(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const input = inputMode === 'citation' ? citation.trim() : caseText.trim();
    if (!input) {
      setError('Please enter a case citation or paste case text.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const payload: ExplainCaseRequest =
        inputMode === 'citation' ? { citation: input } : { text: input };
      const res = await explainCase(payload, token);
      if (!res.data?.id) throw new Error(res.message ?? 'Explanation failed');
      router.push(`/dashboard/cases/${res.data.id}`);
    } catch (err) {
      setError(getFetchErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      {/* Top tabs */}
      <div className={styles.tabs}>
        <button className={`${styles.tabBtn} ${styles.tabActive}`}>Cases</button>
        <button className={styles.tabBtn} disabled>
          Analysis
        </button>
        <button className={styles.tabBtn} disabled>
          Breakdown
        </button>
      </div>

      <div className={styles.content}>
        <h1 className={styles.pageHeading}>Explain a New case</h1>
        <p className={styles.pageSub}>Analyze Precedents with Legal AI-powered judicial insights</p>

        <form onSubmit={handleExplain}>
          <label className={styles.inputLabel}>Paste Judgment Text</label>
          <textarea
            className={styles.textarea}
            value={caseText}
            onChange={(e) => setCaseText(e.target.value)}
            placeholder="Enter the full text of the case or judicial findings here....."
            rows={7}
          />
          {error && (
            <p className={styles.formError} role="alert">
              {error}
            </p>
          )}

          <div className={styles.bottomRow}>
            <button
              type="button"
              className={styles.selectLibraryLink}
              onClick={() => setInputMode('citation')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
              </svg>
              Select from Library
            </button>
            <button type="submit" className={styles.startBtn} disabled={submitting}>
              {submitting ? 'Analysing…' : 'Start Analysis'}
            </button>
          </div>
        </form>

        <section className={styles.historySection}>
          <h2 className={styles.sectionTitle}>Recent Cases</h2>
          {historyLoading ? (
            <p className={styles.stateMsg}>Loading history…</p>
          ) : history.length === 0 ? (
            <p className={styles.stateMsg}>No cases explained yet. Try one above!</p>
          ) : (
            <ul className={styles.historyList}>
              {history.map((item) => (
                <li key={item.id}>
                  <Link href={`/dashboard/cases/${item.id}`} className={styles.historyItem}>
                    <div className={styles.caseIcon} aria-hidden="true">
                      ⚖
                    </div>
                    <div className={styles.caseBody}>
                      <p className={styles.caseTitle}>
                        {item.citation ?? item.title ?? 'Untitled Case'}
                      </p>
                      <p className={styles.caseMeta}>
                        {item.status && (
                          <span
                            className={`${styles.statusBadge} ${styles[`status_${item.status}`]}`}
                          >
                            {item.status}
                          </span>
                        )}{' '}
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
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
