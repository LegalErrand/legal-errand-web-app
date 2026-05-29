'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getResearchSession, generateResearchMemo, saveResearchToNotes, getFetchErrorMessage, getAccessToken } from "@/lib";
import type { ResearchSession } from "@/lib";
import styles from './page.module.scss';

export default function ResearchSessionPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<ResearchSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [memoLoading, setMemoLoading] = useState(false);
  const [memoError, setMemoError] = useState('');
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [savedIdxs, setSavedIdxs] = useState<Set<number>>(new Set());

  useEffect(() => {
    const t = getAccessToken();
    if (!t) { router.replace('/login'); return; }
    setToken(t);
    if (!id) return;
    void (async () => {
      try {
        const res = await getResearchSession(id, t);
        if (res.data) setSession(res.data);
        else setError(res.message ?? 'Session not found');
      } catch (err) {
        setError(getFetchErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [router, id]);

  async function handleGenerateMemo() {
    if (!token || !id) return;
    setMemoLoading(true);
    setMemoError('');
    try {
      const res = await generateResearchMemo(id, token);
      if (res.data?.memo) {
        setSession((prev) => prev ? { ...prev, memo: res.data!.memo } : prev);
      }
    } catch (err) {
      setMemoError(getFetchErrorMessage(err));
    } finally {
      setMemoLoading(false);
    }
  }

  async function handleSaveToNotes(resultIndex: number) {
    if (!token || !id || savingIdx !== null) return;
    setSavingIdx(resultIndex);
    try {
      await saveResearchToNotes(id, resultIndex, token);
      setSavedIdxs((prev) => new Set(prev).add(resultIndex));
    } catch { /* silent — result still available */ }
    finally { setSavingIdx(null); }
  }

  if (loading) return <div className={styles.page}><p className={styles.state}>Loading session…</p></div>;
  if (error) return <div className={styles.page}><p className={styles.stateError}>{error}</p></div>;
  if (!session) return <div className={styles.page}><p className={styles.state}>Session not found.</p></div>;

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <Link href="/dashboard/research" className={styles.backBtn}>← Research</Link>
        <button
          className={styles.memoBtn}
          onClick={handleGenerateMemo}
          disabled={memoLoading}
        >
          {memoLoading ? 'Generating…' : session.memo ? 'Regenerate Memo' : '✦ Generate Memo'}
        </button>
      </header>

      <div className={styles.content}>
        <div className={styles.sessionHead}>
          <h1 className={styles.queryTitle}>{session.query}</h1>
          {session.refinedQuery && session.refinedQuery !== session.query && (
            <p className={styles.refined}>Refined: <em>{session.refinedQuery}</em></p>
          )}
          <p className={styles.sessionDate}>{new Date(session.createdAt).toLocaleDateString()}</p>
        </div>

        {memoError && <p className={styles.stateError}>{memoError}</p>}

        {session.memo && (
          <div className={styles.memoCard}>
            <h2 className={styles.cardTitle}>Research Memo</h2>
            <p className={styles.memoBody}>{session.memo}</p>
          </div>
        )}

        <h2 className={styles.resultsHeading}>Results ({session.results.length})</h2>
        {session.results.length === 0 ? (
          <p className={styles.state}>No results for this session.</p>
        ) : (
          <div className={styles.resultsList}>
            {session.results.map((r, idx) => (
              <div key={r.documentId} className={styles.resultCard}>
                <div className={styles.resultHeader}>
                  <Link href={`/dashboard/library/${r.documentId}`} className={styles.resultTitle}>{r.title}</Link>
                  <span className={styles.matchScore}>{Math.round(r.matchScore * 100)}% match</span>
                </div>
                {r.citation && <p className={styles.citation}>{r.citation}</p>}
                {r.excerpt && <p className={styles.excerpt}>{r.excerpt}</p>}
                <div className={styles.resultFooter}>
                  <div className={styles.tags}>
                    {r.subject && <span className={styles.tag}>{r.subject}</span>}
                    {r.type && <span className={styles.tag}>{r.type}</span>}
                    {r.courtLevel && <span className={styles.tag}>{r.courtLevel}</span>}
                  </div>
                  <button
                    className={`${styles.saveNoteBtn} ${savedIdxs.has(idx) ? styles.saveNoteBtnDone : ''}`}
                    onClick={() => handleSaveToNotes(idx)}
                    disabled={savingIdx === idx || savedIdxs.has(idx)}
                  >
                    {savedIdxs.has(idx) ? '✓ Saved' : savingIdx === idx ? 'Saving…' : '+ Save to Notes'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
