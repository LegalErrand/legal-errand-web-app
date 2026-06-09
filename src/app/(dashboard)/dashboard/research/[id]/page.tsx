'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  getResearchSession,
  generateResearchMemo,
  saveResearchToNotes,
  getFetchErrorMessage,
  getAccessToken,
} from '@/lib';
import type { ResearchSession } from '@/lib';
import styles from './page.module.scss';

export default function ResearchSessionPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<ResearchSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [memoLoading, setMemoLoading] = useState(false);
  const [memoError, setMemoError] = useState('');
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [savedIdxs, setSavedIdxs] = useState<Set<number>>(new Set());

  useEffect(() => {
    const t = getAccessToken();
    if (!t) {
      router.replace('/login');
      return;
    }
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
        setSession((prev) => (prev ? { ...prev, memo: res.data!.memo } : prev));
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
    } catch {
      /* silent */
    } finally {
      setSavingIdx(null);
    }
  }

  if (loading)
    return (
      <div className={styles.page}>
        <p className={styles.stateMsg}>Loading session…</p>
      </div>
    );
  if (error)
    return (
      <div className={styles.page}>
        <p className={styles.stateError}>{error}</p>
      </div>
    );
  if (!session)
    return (
      <div className={styles.page}>
        <p className={styles.stateMsg}>Session not found.</p>
      </div>
    );

  const activeResult = session.results[activeIdx] ?? null;

  return (
    <div className={styles.page}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link href="/dashboard/research" className={styles.breadcrumbLink}>
          Research
        </Link>
        <span className={styles.breadcrumbSep}>›</span>
        <span className={styles.breadcrumbCurrent}>Details viewer</span>
        <span className={styles.breadcrumbSep}>›</span>
      </div>

      <div className={styles.body}>
        {/* Main content */}
        <div className={styles.main}>
          {session.results.length === 0 ? (
            <p className={styles.stateMsg}>No results for this session.</p>
          ) : (
            <>
              {/* Result tabs (if multiple) */}
              {session.results.length > 1 && (
                <div className={styles.resultTabs}>
                  {session.results.map((r, i) => (
                    <button
                      key={r.documentId}
                      className={`${styles.resultTab} ${i === activeIdx ? styles.resultTabActive : ''}`}
                      onClick={() => setActiveIdx(i)}
                      type="button"
                    >
                      {i + 1}. {r.title.length > 50 ? r.title.slice(0, 50) + '…' : r.title}
                    </button>
                  ))}
                </div>
              )}

              {activeResult && (
                <div className={styles.caseContent}>
                  <h1 className={styles.caseTitle}>{activeResult.title}</h1>

                  {activeResult.courtLevel && (
                    <span className={styles.courtBadge}>{activeResult.courtLevel}</span>
                  )}

                  {activeResult.citation && (
                    <p className={styles.citation}>{activeResult.citation}</p>
                  )}

                  {activeResult.excerpt && (
                    <div className={styles.excerptBlock}>
                      <p className={styles.excerptHighlight}>{activeResult.excerpt}</p>
                    </div>
                  )}

                  {session.memo && (
                    <div className={styles.memoSection}>
                      <h2 className={styles.memoLabel}>Core Legal Principle:</h2>
                      <p className={styles.memoText}>{session.memo}</p>
                    </div>
                  )}

                  {!session.memo && (
                    <div className={styles.memoSection}>
                      <div className={styles.relevanceRow}>
                        <span className={styles.relevanceLabel}>Relevance score</span>
                        <span className={styles.relevanceScore}>
                          {Math.round(
                            (activeResult.relevanceScore ?? activeResult.matchScore ?? 0) * 100
                          )}
                          %
                        </span>
                      </div>
                      <div className={styles.matchBarWrap}>
                        <div
                          className={styles.matchBar}
                          style={{
                            ['--bar-pct' as string]: `${Math.round((activeResult.relevanceScore ?? activeResult.matchScore ?? 0) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {memoError && <p className={styles.stateError}>{memoError}</p>}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right sidebar */}
        <aside className={styles.sidebar}>
          <p className={styles.sidebarHeading}>Primary action</p>

          <button
            className={styles.actionBtn}
            onClick={() => activeIdx !== null && handleSaveToNotes(activeIdx)}
            disabled={savingIdx === activeIdx || savedIdxs.has(activeIdx)}
          >
            {savedIdxs.has(activeIdx)
              ? '✓ Saved to Notes'
              : savingIdx === activeIdx
                ? 'Saving…'
                : 'Save to Notes'}
          </button>

          <button
            className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
            onClick={handleGenerateMemo}
            disabled={memoLoading}
          >
            {memoLoading
              ? 'Generating…'
              : session.memo
                ? 'Regenerate Memo'
                : 'Open in Case explainer'}
          </button>

          <div className={styles.courtImgWrap}>
            <div className={styles.courtImgPlaceholder}>
              <span className={styles.courtImgLabel}>Supreme Court</span>
              <span className={styles.courtImgSub}>Federal Republic of Nigeria</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
