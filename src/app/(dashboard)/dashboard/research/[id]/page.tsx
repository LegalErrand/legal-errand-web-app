'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  getResearchSession,
  generateResearchMemo,
  saveResearchToNotes,
  explainCase,
  getCaseExplanation,
  getFetchErrorMessage,
  getAccessToken,
  useTypewriter,
} from '@/lib';
import type { ResearchSession, CaseExplanation } from '@/lib';
import { Spinner, ShimmerAnalysis } from '@/components';
import styles from './page.module.scss';

const SKIP_PREFIX_RE = /^(skip to (document |main )?content\s*)+/i;
function cleanSnippet(text: string | undefined): string {
  if (!text) return '';
  return text.replace(SKIP_PREFIX_RE, '').trim();
}

export default function ResearchSessionPage() {
  return (
    <Suspense>
      <ResearchSessionPageInner />
    </Suspense>
  );
}

/** Section body that types itself out on first render / when text changes */
function TypewriterSection({ text, className }: { text: string; className?: string }) {
  const { displayed, done } = useTypewriter(text, 8, 10);
  return (
    <p className={className}>
      {displayed}
      {!done && <span className={styles.cursor} aria-hidden="true" />}
    </p>
  );
}

function ResearchSessionPageInner() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<ResearchSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [memoLoading, setMemoLoading] = useState(false);
  const [memoError, setMemoError] = useState('');
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [savedIdxs, setSavedIdxs] = useState<Set<number>>(new Set());
  const [saveError, setSaveError] = useState('');
  const [explanation, setExplanation] = useState<CaseExplanation | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);

  const activeIdx = Math.max(0, parseInt(searchParams.get('result') ?? '0', 10));
  const setActiveIdx = useCallback(
    (idx: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('result', String(idx));
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

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

  // Fetch case explanation whenever the active result changes
  useEffect(() => {
    if (!token || !session) return;
    const total = session.results.length;
    const idx = Math.min(activeIdx, total - 1);
    const result = session.results[idx];
    if (!result?.documentId) return;

    let cancelled = false;
    setExplanation(null);
    setExplainLoading(true);

    void (async () => {
      try {
        const res = await explainCase({ documentId: result.documentId }, token);
        if (cancelled) return;
        const expl = res.data;
        if (!expl) return;

        if (expl.status === 'complete' || expl.facts || expl.holding) {
          setExplanation(expl);
          setExplainLoading(false);
          return;
        }

        // Poll if still processing
        if (expl.id && (expl.status === 'pending' || expl.status === 'processing')) {
          let attempts = 0;
          const poll = async () => {
            if (cancelled || attempts > 12) {
              setExplainLoading(false);
              return;
            }
            attempts++;
            await new Promise((r) => setTimeout(r, 3000));
            if (cancelled) return;
            try {
              const pollRes = await getCaseExplanation(expl.id, token);
              if (cancelled) return;
              const p = pollRes.data;
              if (p?.status === 'complete' || p?.facts || p?.holding) {
                setExplanation(p);
                setExplainLoading(false);
              } else {
                void poll();
              }
            } catch {
              setExplainLoading(false);
            }
          };
          void poll();
        } else {
          setExplainLoading(false);
        }
      } catch {
        if (!cancelled) setExplainLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, session, activeIdx]);

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
    setSaveError('');
    try {
      await saveResearchToNotes(id, resultIndex, token);
      setSavedIdxs((prev) => new Set(prev).add(resultIndex));
    } catch (err) {
      setSaveError(getFetchErrorMessage(err));
    } finally {
      setSavingIdx(null);
    }
  }

  if (loading)
    return (
      <div className={styles.page}>
        <div className={styles.stateMsg}>
          <Spinner size={22} label="Loading session…" />
        </div>
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

  const total = session.results.length;
  const clampedIdx = Math.min(activeIdx, total - 1);
  const activeResult = session.results[clampedIdx] ?? null;

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumb}>
        <Link href="/dashboard/research" className={styles.breadcrumbLink}>
          Research
        </Link>
        <span className={styles.breadcrumbSep}>›</span>
        <span className={styles.breadcrumbCurrent}>Details viewer</span>
        <span className={styles.breadcrumbSep}>›</span>
      </div>

      <div className={styles.body}>
        <div className={styles.main}>
          {total === 0 ? (
            <p className={styles.stateMsg}>No results for this session.</p>
          ) : (
            <>
              {total > 1 && (
                <div className={styles.resultNav}>
                  <button
                    className={styles.resultNavBtn}
                    onClick={() => setActiveIdx(Math.max(0, clampedIdx - 1))}
                    disabled={clampedIdx === 0}
                    type="button"
                  >
                    ← Prev
                  </button>
                  <span className={styles.resultNavLabel}>
                    Result {clampedIdx + 1} of {total}
                  </span>
                  <button
                    className={styles.resultNavBtn}
                    onClick={() => setActiveIdx(Math.min(total - 1, clampedIdx + 1))}
                    disabled={clampedIdx === total - 1}
                    type="button"
                  >
                    Next →
                  </button>
                </div>
              )}

              {activeResult && (
                <div className={styles.caseContent}>
                  <h1 className={styles.caseTitle}>{activeResult.title}</h1>

                  <div className={styles.metaRow}>
                    {activeResult.courtLevel && (
                      <span className={styles.courtBadge}>{activeResult.courtLevel}</span>
                    )}
                    {activeResult.subject && (
                      <span className={styles.subjectBadge}>{activeResult.subject}</span>
                    )}
                    {activeResult.citation && (
                      <span className={styles.citation}>{activeResult.citation}</span>
                    )}
                  </div>

                  <div className={styles.relevanceRow}>
                    <span className={styles.relevanceLabel}>Relevance to your search</span>
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

                  {/* Relevance context from snippet */}
                  {activeResult.snippet && (
                    <div className={styles.relevanceContext}>
                      <p className={styles.sectionLabel}>Why this case is relevant</p>
                      <p className={styles.relevanceText}>{cleanSnippet(activeResult.snippet)}</p>
                    </div>
                  )}

                  {/* AI case explanation */}
                  <div className={styles.analysisBlock}>
                    <p className={styles.sectionLabel}>Legal Analysis</p>
                    {explainLoading && (
                      <>
                        <div className={styles.analysisLoadingRow}>
                          <Spinner size={16} label="Generating legal analysis…" />
                        </div>
                        <ShimmerAnalysis />
                      </>
                    )}
                    {!explainLoading && explanation && (
                      <div className={styles.analysisSections}>
                        {explanation.facts && (
                          <div className={styles.analysisSection}>
                            <p className={styles.analysisSectionTitle}>Facts</p>
                            <TypewriterSection
                              text={explanation.facts}
                              className={styles.analysisSectionText}
                            />
                          </div>
                        )}
                        {explanation.issue && (
                          <div className={styles.analysisSection}>
                            <p className={styles.analysisSectionTitle}>Legal Issue</p>
                            <TypewriterSection
                              text={explanation.issue}
                              className={styles.analysisSectionText}
                            />
                          </div>
                        )}
                        {explanation.holding && (
                          <div className={styles.analysisSection}>
                            <p className={styles.analysisSectionTitle}>Judgment / Holding</p>
                            <TypewriterSection
                              text={explanation.holding}
                              className={styles.analysisSectionText}
                            />
                          </div>
                        )}
                        {explanation.reasoning && (
                          <div className={styles.analysisSection}>
                            <p className={styles.analysisSectionTitle}>Reasoning</p>
                            <TypewriterSection
                              text={explanation.reasoning}
                              className={styles.analysisSectionText}
                            />
                          </div>
                        )}
                        {explanation.significance && (
                          <div className={styles.analysisSection}>
                            <p className={styles.analysisSectionTitle}>Significance</p>
                            <TypewriterSection
                              text={explanation.significance}
                              className={styles.analysisSectionText}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    {!explainLoading && !explanation && (
                      <p className={styles.stateMsg}>Could not generate analysis for this case.</p>
                    )}
                  </div>

                  {session.memo && (
                    <div className={styles.memoSection}>
                      <h2 className={styles.memoLabel}>Core Legal Principle:</h2>
                      <p className={styles.memoText}>{session.memo}</p>
                    </div>
                  )}

                  {memoError && <p className={styles.stateError}>{memoError}</p>}
                </div>
              )}
            </>
          )}
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <p className={styles.sidebarHeading}>primary action</p>

            <button
              className={styles.actionBtn}
              onClick={() => handleSaveToNotes(clampedIdx)}
              disabled={savingIdx === clampedIdx || savedIdxs.has(clampedIdx)}
            >
              {savedIdxs.has(clampedIdx) ? (
                '✓ Saved to Notes'
              ) : savingIdx === clampedIdx ? (
                <span className={styles.btnLoading}>
                  <Spinner size={15} /> Saving…
                </span>
              ) : (
                'Save to Notes'
              )}
            </button>

            {saveError && <p className={styles.stateError}>{saveError}</p>}

            <button
              className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
              onClick={handleGenerateMemo}
              disabled={memoLoading}
            >
              {memoLoading ? (
                <span className={styles.btnLoading}>
                  <Spinner size={15} /> Generating…
                </span>
              ) : session.memo ? (
                'Regenerate Memo'
              ) : (
                'Generate Session Memo'
              )}
            </button>

            {activeResult?.documentId && (
              <Link
                href={`/dashboard/library/${activeResult.documentId}`}
                className={styles.readCaseLink}
              >
                Read full case in Library →
              </Link>
            )}

            <div className={styles.courtImgWrap}>
              <div className={styles.courtImgPlaceholder}>
                <span className={styles.courtImgLabel}>
                  {activeResult?.courtLevel ?? 'Supreme Court'}
                </span>
                <span className={styles.courtImgSub}>Federal Republic of Nigeria</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
