'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { explainCase, getCaseExplainerHistory, getFetchErrorMessage } from '@/lib/api';
import { getAccessToken } from '@/lib/authStorage';
import type { CaseHistoryItem, ExplainCaseRequest } from '@/lib/types';
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
    if (!t) { router.replace('/login'); return; }
    setToken(t);
    void loadHistory(t);
  }, [router]);

  async function loadHistory(t: string) {
    setHistoryLoading(true);
    try {
      const res = await getCaseExplainerHistory(t, { limit: 20 });
      setHistory(res.data?.data ?? []);
    } catch { /* silent */ } finally {
      setHistoryLoading(false);
    }
  }

  async function handleExplain(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const input = inputMode === 'citation' ? citation.trim() : caseText.trim();
    if (!input) { setError('Please enter a case citation or paste case text.'); return; }

    setError('');
    setSubmitting(true);
    try {
      const payload: ExplainCaseRequest = inputMode === 'citation'
        ? { citation: input }
        : { text: input };
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
      <header className={styles.topBar}>
        <h1 className={styles.pageTitle}>Case Explainer</h1>
      </header>

      <div className={styles.content}>
        <section className={styles.explainCard}>
          <h2 className={styles.sectionTitle}>Explain a Case</h2>
          <p className={styles.sectionSub}>Enter a case citation or paste the case text to get an AI-powered breakdown.</p>

          <div className={styles.modeTabs}>
            <button
              className={`${styles.modeTab} ${inputMode === 'citation' ? styles.modeTabActive : ''}`}
              onClick={() => setInputMode('citation')}
            >
              By Citation
            </button>
            <button
              className={`${styles.modeTab} ${inputMode === 'text' ? styles.modeTabActive : ''}`}
              onClick={() => setInputMode('text')}
            >
              Paste Text
            </button>
          </div>

          <form onSubmit={handleExplain} className={styles.explainForm}>
            {inputMode === 'citation' ? (
              <input
                className={styles.input}
                value={citation}
                onChange={(e) => setCitation(e.target.value)}
                placeholder="e.g. Donoghue v Stevenson [1932] AC 562"
              />
            ) : (
              <textarea
                className={styles.textarea}
                value={caseText}
                onChange={(e) => setCaseText(e.target.value)}
                placeholder="Paste the full case text here…"
                rows={6}
              />
            )}
            {error && <p className={styles.formError} role="alert">{error}</p>}
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? 'Analysing…' : 'Explain Case'}
            </button>
          </form>
        </section>

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
                    <div className={styles.caseIcon} aria-hidden="true">⚖</div>
                    <div className={styles.caseBody}>
                      <p className={styles.caseTitle}>{item.citation ?? item.title ?? 'Untitled Case'}</p>
                      <p className={styles.caseMeta}>
                        {item.status && <span className={`${styles.statusBadge} ${styles[`status_${item.status}`]}`}>{item.status}</span>}
                        {' '}{new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
