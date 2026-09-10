'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getCaseExplanation, saveCaseToNotes, getFetchErrorMessage, getAccessToken } from '@/lib';
import type { CaseExplanation } from '@/lib';
import { Spinner } from '@/components';
import styles from './page.module.scss';

const CACHE_PREFIX = 'le:case-explanation:';

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>{title}</h2>
      <p className={styles.cardBody}>{body}</p>
    </div>
  );
}

function readCachedExplanation(id: string): CaseExplanation | null {
  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${id}`);
    if (!raw) return null;
    return JSON.parse(raw) as CaseExplanation;
  } catch {
    return null;
  }
}

export default function CaseDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [caseData, setCaseData] = useState<CaseExplanation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // Show full brief first — Analysis used to look empty while typewriter ran / fields were missing.
  const [tab, setTab] = useState<'analysis' | 'breakdown'>('breakdown');

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    if (!id) return;

    const cached = readCachedExplanation(id);
    if (cached && (cached.facts || cached.issue || cached.holding || cached.reasoning)) {
      setCaseData(cached);
      setLoading(false);
    }

    async function fetchCase() {
      try {
        const res = await getCaseExplanation(id, token!);
        if (res.data) {
          setCaseData(res.data);
          try {
            sessionStorage.setItem(`${CACHE_PREFIX}${id}`, JSON.stringify(res.data));
          } catch {
            /* ignore quota */
          }
        } else if (!cached) {
          setError(res.message ?? 'Case not found');
        }
      } catch (err) {
        if (!cached) setError(getFetchErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }

    void fetchCase();
  }, [id, router]);

  async function handleSaveToNotes() {
    const token = getAccessToken();
    if (!token || !id) return;
    setSaving(true);
    try {
      await saveCaseToNotes(id, token);
      setSaved(true);
    } catch (err) {
      setError(getFetchErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className={styles.page}>
        <div className={styles.state}>
          <Spinner size={22} label="Loading case…" />
        </div>
      </div>
    );
  if (error && !caseData)
    return (
      <div className={styles.page}>
        <p className={styles.stateError}>{error}</p>
      </div>
    );
  if (!caseData)
    return (
      <div className={styles.page}>
        <p className={styles.state}>Case not found.</p>
      </div>
    );

  const citation = caseData.citation?.trim() || 'Case Analysis';
  const hasSnapshot = Boolean(caseData.facts || caseData.issue || caseData.holding);

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <nav className={styles.tabs} aria-label="Case view">
          <Link href="/dashboard/cases" className={styles.tabLink}>
            Cases
          </Link>
          <button
            className={`${styles.tabBtn} ${tab === 'analysis' ? styles.tabActive : ''}`}
            onClick={() => setTab('analysis')}
          >
            Analysis
          </button>
          <button
            className={`${styles.tabBtn} ${tab === 'breakdown' ? styles.tabActive : ''}`}
            onClick={() => setTab('breakdown')}
          >
            Breakdown
          </button>
        </nav>
        <div className={styles.headerActions}>
          {!saved && (
            <button className={styles.saveBtn} onClick={handleSaveToNotes} disabled={saving}>
              {saving ? (
                <span className={styles.btnLoading}>
                  <Spinner size={14} /> Saving…
                </span>
              ) : (
                'Save to Notes'
              )}
            </button>
          )}
          {saved && <span className={styles.savedBadge}>✓ Saved to Notes</span>}
        </div>
      </header>

      {error && <p className={styles.stateError}>{error}</p>}

      {tab === 'analysis' && (
        <div className={styles.breakdownLayout}>
          <div className={styles.breakdownMain}>
            <div className={styles.caseHeadingWrap}>
              <p className={styles.caseCitation}>{citation}</p>
              <p className={styles.pageSub}>
                Snapshot of facts, issue, and holding. Open Breakdown for the full brief.
              </p>
            </div>
            {!hasSnapshot && (
              <div className={styles.card}>
                <p className={styles.cardBody}>
                  This analysis is incomplete. Open Breakdown, or go back and run Start Analysis
                  again.
                </p>
              </div>
            )}
            {caseData.facts && <Section title="Facts" body={caseData.facts} />}
            {caseData.issue && <Section title="Issue" body={caseData.issue} />}
            {caseData.holding && <Section title="Holding" body={caseData.holding} />}
            <div className={styles.analysisActions}>
              <button className={styles.viewBreakdownBtn} onClick={() => setTab('breakdown')}>
                View full Breakdown →
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'breakdown' && (
        <div className={styles.breakdownLayout}>
          <div className={styles.breakdownMain}>
            <div className={styles.caseHeadingWrap}>
              <p className={styles.caseCitation}>{citation}</p>
            </div>

            {!hasSnapshot && !caseData.reasoning && (
              <div className={styles.card}>
                <p className={styles.cardBody}>
                  No brief content was saved for this case. Return to Cases and run the analysis
                  again.
                </p>
              </div>
            )}

            {caseData.facts && <Section title="Facts" body={caseData.facts} />}
            {caseData.issue && <Section title="Issue" body={caseData.issue} />}
            {caseData.holding && <Section title="Holding" body={caseData.holding} />}
            {caseData.reasoning && <Section title="Reasoning" body={caseData.reasoning} />}
            {caseData.significance && <Section title="Significance" body={caseData.significance} />}

            {caseData.practiceQuestions && caseData.practiceQuestions.length > 0 && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Practice Questions</h2>
                <ol className={styles.questionList}>
                  {caseData.practiceQuestions.map((q, i) => (
                    <li key={i} className={styles.questionItem}>
                      {q}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          <div className={styles.breakdownSide}>
            {!saved && (
              <button
                className={`${styles.sideAction} ${styles.sideActionPrimary}`}
                onClick={handleSaveToNotes}
                disabled={saving}
              >
                {saving ? (
                  <span className={styles.btnLoading}>
                    <Spinner size={14} /> Saving…
                  </span>
                ) : (
                  'Save to Notes'
                )}
              </button>
            )}
            {saved && <span className={styles.savedBadge}>✓ Saved</span>}

            {caseData.relatedCases && caseData.relatedCases.length > 0 && (
              <>
                <p className={styles.relatedCasesHeading}>Related cases</p>
                <ul className={styles.relatedList}>
                  {caseData.relatedCases.map((rc) => (
                    <li
                      key={typeof rc === 'string' ? rc : rc.citation}
                      className={styles.relatedItem}
                    >
                      {typeof rc === 'string' ? (
                        <span className={styles.relatedCitation}>{rc}</span>
                      ) : (
                        <>
                          <div className={styles.relatedCitationRow}>
                            <span className={styles.relatedCitation}>{rc.citation}</span>
                            {rc.relation && (
                              <span className={styles.relatedRelation}>{rc.relation}</span>
                            )}
                          </div>
                          {rc.description && <p className={styles.relatedDesc}>{rc.description}</p>}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
