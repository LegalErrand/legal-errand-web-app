'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  getCaseExplanation,
  saveCaseToNotes,
  getFetchErrorMessage,
  getAccessToken,
  useTypewriter,
} from '@/lib';
import type { CaseExplanation } from '@/lib';
import { Spinner } from '@/components';
import styles from './page.module.scss';

/** Section with typewriter animation on first render */
function Section({ title, body }: { title: string; body: string }) {
  const { displayed, done } = useTypewriter(body, 8, 10);
  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>{title}</h2>
      <p className={styles.cardBody}>
        {displayed}
        {!done && <span className={styles.cursor} aria-hidden="true" />}
      </p>
    </div>
  );
}

export default function CaseDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [caseData, setCaseData] = useState<CaseExplanation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<'analysis' | 'breakdown'>('analysis');

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    if (!id) return;

    async function fetchCase() {
      try {
        const res = await getCaseExplanation(id, token!);
        if (res.data) {
          setCaseData(res.data);
        } else {
          setError(res.message ?? 'Case not found');
        }
      } catch (err) {
        setError(getFetchErrorMessage(err));
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
              <p className={styles.caseCitation}>{caseData.citation ?? 'Case Analysis'}</p>
              <p className={styles.pageSub}>
                Snapshot of facts, issue, and holding. Open Breakdown for the full brief.
              </p>
            </div>
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
              <p className={styles.caseCitation}>{caseData.citation ?? 'Case Analysis'}</p>
            </div>

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
