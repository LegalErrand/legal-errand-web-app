'use client';

import { useEffect, useRef, useState } from 'react';
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

const POLL_INTERVAL = 3500; // ms

// Analysis steps derived from status
const ANALYSIS_STEPS = [
  { key: 'ocr', label: 'OCR Extraction' },
  { key: 'facts', label: 'Facts Identification' },
  { key: 'analysis', label: 'Legal principle analysis' },
] as const;

function getStepStatus(
  stepIdx: number,
  overallPct: number
): 'complete' | 'in_progress' | 'pending' {
  const threshold = ((stepIdx + 1) / ANALYSIS_STEPS.length) * 100;
  if (overallPct >= threshold) return 'complete';
  if (overallPct >= threshold - 100 / ANALYSIS_STEPS.length) return 'in_progress';
  return 'pending';
}

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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function isProcessing(data: CaseExplanation | null): boolean {
    return data?.status === 'pending' || data?.status === 'processing';
  }

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
          if (!isProcessing(res.data)) {
            clearPoll();
            setTab('breakdown');
          }
        } else {
          setError(res.message ?? 'Case not found');
          clearPoll();
        }
      } catch (err) {
        setError(getFetchErrorMessage(err));
        clearPoll();
      } finally {
        setLoading(false);
      }
    }

    function clearPoll() {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }

    void fetchCase();
    pollRef.current = setInterval(() => void fetchCase(), POLL_INTERVAL);

    return () => clearPoll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const processing = isProcessing(caseData);
  const pct = processing ? (caseData.progress ?? 0) : 100;

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
            className={`${styles.tabBtn} ${!processing && tab === 'breakdown' ? styles.tabActive : ''}`}
            onClick={() => {
              if (!processing) setTab('breakdown');
            }}
            disabled={processing}
          >
            Breakdown
          </button>
        </nav>
        <div className={styles.headerActions}>
          {!processing && !saved && (
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

      {/* Analysis / Processing view */}
      {(tab === 'analysis' || processing) && (
        <div className={styles.analysisWrap}>
          <div className={styles.analysisCard}>
            <div className={styles.analysisHeader}>
              <div className={`${styles.spinIcon} ${processing ? styles.spinning : ''}`}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeDasharray="40 20"
                  />
                </svg>
              </div>
              <div>
                <h2 className={styles.analysisTitle}>
                  {processing ? 'AI Scanning & Analyzing' : 'Analysis Complete'}
                </h2>
                <p className={styles.analysisCitation}>
                  Case Reference: {caseData.citation ?? 'Processing…'}
                </p>
              </div>
            </div>

            <div className={styles.progressSection}>
              <div className={styles.progressLabelRow}>
                <span className={styles.progressLabel}>Over all progress</span>
                <span className={styles.progressPct}>{pct}%</span>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ ['--pct' as string]: `${pct}%` }} />
              </div>
            </div>

            <div className={styles.stepsList}>
              {ANALYSIS_STEPS.map((step, i) => {
                const status = getStepStatus(i, pct);
                return (
                  <div key={step.key} className={`${styles.step} ${styles[`step_${status}`]}`}>
                    <span className={styles.stepIcon}>
                      {status === 'complete' ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="12" r="10" fill="#16A34A" />
                          <path
                            d="M8 12l3 3 5-5"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : status === 'in_progress' ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                        >
                          <rect x="3" y="10" width="4" height="4" rx="1" fill="#D97706" />
                          <rect x="10" y="7" width="4" height="10" rx="1" fill="#D97706" />
                          <rect x="17" y="4" width="4" height="16" rx="1" fill="#D97706" />
                        </svg>
                      ) : (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="12" r="8" stroke="#D1D5DB" strokeWidth="2" />
                        </svg>
                      )}
                    </span>
                    <span className={styles.stepLabel}>{step.label}</span>
                    <span className={styles.stepStatus}>
                      {status === 'complete'
                        ? 'Complete'
                        : status === 'in_progress'
                          ? 'In progress'
                          : 'Pending'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className={styles.analysisActions}>
              {processing ? (
                <>
                  <button className={styles.processingBtn} disabled>
                    <span className={styles.processingDot} />
                    Processing.......
                  </button>
                  <Link href="/dashboard/cases" className={styles.cancelBtn}>
                    cancel Analysis
                  </Link>
                </>
              ) : (
                <button className={styles.viewBreakdownBtn} onClick={() => setTab('breakdown')}>
                  View Breakdown →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Breakdown view — each Section types out its body */}
      {tab === 'breakdown' && !processing && (
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
            <button className={styles.sideAction}>Generate flash cards</button>
            <button className={styles.sideAction}>Export PDF</button>

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
