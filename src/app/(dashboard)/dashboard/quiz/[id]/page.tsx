'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getQuestion, submitAnswer, getFetchErrorMessage, getAccessToken } from '@/lib';
import type { Question, QuestionAttempt } from '@/lib';
import styles from './page.module.scss';

export default function QuizPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [token, setToken] = useState('');
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuestionAttempt | null>(null);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = getAccessToken();
    if (!t) {
      router.replace('/login');
      return;
    }
    setToken(t);

    void (async () => {
      try {
        const res = await getQuestion(id, t);
        if (res.data) {
          setQuestion(res.data);
        } else {
          setError(res.message ?? 'Question not found.');
        }
      } catch (err) {
        setError(getFetchErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [router, id]);

  const handleFormat = useCallback((format: 'bold' | 'italic' | 'list') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.slice(start, end);
    let replacement = '';
    if (format === 'bold') replacement = `**${selected}**`;
    else if (format === 'italic') replacement = `_${selected}_`;
    else
      replacement = selected
        .split('\n')
        .map((l) => `• ${l}`)
        .join('\n');
    const newVal = ta.value.slice(0, start) + replacement + ta.value.slice(end);
    setAnswer(newVal);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + replacement.length, start + replacement.length);
    });
  }, []);

  async function handleSubmit() {
    if (!token || !id || submitting) return;
    const trimmed = answer.trim();
    if (!trimmed) {
      setError('Please write your answer before submitting.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await submitAnswer(id, trimmed, token);
      if (res.data) {
        setResult(res.data);
      } else {
        setError(res.message ?? 'Submission failed. Please try again.');
      }
    } catch (err) {
      setError(getFetchErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.stateMsg}>Loading question…</p>
      </div>
    );
  }

  // ── Result / graded state ────────────────────────────────────────────────────
  if (result) {
    const total = result.scores?.total ?? 0;
    return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <nav className={styles.breadcrumb} aria-label="breadcrumb">
            <Link href="/dashboard/progress" className={styles.breadLink}>
              Question Bank
            </Link>
            <span className={styles.breadSep}>›</span>
            <span className={styles.breadCurrent}>Result</span>
          </nav>
        </div>
        <div className={styles.submittedBox}>
          <div
            className={`${styles.submittedIcon} ${total >= 50 ? styles.submittedIconPass : styles.submittedIconFail}`}
          >
            {total}%
          </div>
          <h2 className={styles.submittedTitle}>AI Grading Complete</h2>
          {result.aiFeedback && <p className={styles.submittedSub}>{result.aiFeedback}</p>}
          {result.scores && <ScoreBreakdown scores={result.scores} />}
          <div className={styles.submittedActions}>
            <Link href="/dashboard/progress" className={styles.backToBank}>
              Back to Question Bank
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Error / not found state ──────────────────────────────────────────────────
  if (!question) {
    return (
      <div className={styles.page}>
        <p className={styles.stateMsg}>{error || 'Question not found.'}</p>
      </div>
    );
  }

  const scenarioText = question.scenario ?? question.text ?? question.prompt ?? '';

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <nav className={styles.breadcrumb} aria-label="breadcrumb">
          <Link href="/dashboard/reasoning" className={styles.breadLink}>
            Quizzes
          </Link>
          <span className={styles.breadSep}>›</span>
          <span className={styles.breadCurrent}>Question 1 of 10</span>
          <span className={styles.breadSep}>›</span>
        </nav>
        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={submitting || !answer.trim()}
        >
          {submitting ? 'Submitting…' : 'Submit for AI Grading'}
        </button>
      </div>

      {error && (
        <p className={styles.errorMsg} role="alert">
          {error}
        </p>
      )}

      {/* Main split layout */}
      <div className={styles.split}>
        {/* Left — Scenario + question */}
        <div className={styles.casePanel}>
          <div className={styles.caseCard}>
            {scenarioText && (
              <>
                <h2 className={styles.caseTitle}>
                  Case Study: {question.subject ?? 'Legal Scenario'}
                </h2>
                <div className={styles.caseText}>
                  {scenarioText
                    .split('\n')
                    .map((para, i) => (para.trim() ? <p key={i}>{para.trim()}</p> : null))}
                </div>
              </>
            )}
            <div className={styles.questionBox}>
              <p className={styles.questionText}>
                {question.prompt ?? question.text ?? 'Answer the question below.'}
              </p>
            </div>
            <div className={styles.caseNavRow}>
              <Link href="/dashboard/reasoning" className={styles.prevBtn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M19 12H5M11 6l-6 6 6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Prev
              </Link>
              <button className={styles.nextBtn} onClick={() => router.push('/dashboard/progress')}>
                Next
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
          </div>
        </div>

        {/* Right — Reasoning workspace */}
        <div className={styles.workspacePanel}>
          <div className={styles.workspaceHeader}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 2a7 7 0 0 1 7 7c0 2.7-1.52 5.05-3.75 6.28L15 21H9l.75-5.72A7 7 0 0 1 5 9a7 7 0 0 1 7-7Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            <span className={styles.workspaceTitle}>Reasoning workspace</span>
          </div>
          <div className={styles.toolbar}>
            <button
              className={styles.toolBtn}
              onClick={() => handleFormat('bold')}
              title="Bold"
              type="button"
            >
              <strong>B</strong>
            </button>
            <button
              className={styles.toolBtn}
              onClick={() => handleFormat('italic')}
              title="Italic"
              type="button"
            >
              <em>I</em>
            </button>
            <button
              className={styles.toolBtn}
              onClick={() => handleFormat('list')}
              title="List"
              type="button"
            >
              ≡
            </button>
          </div>
          <textarea
            ref={textareaRef}
            className={styles.workspace}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Start drafting the legal issues here...."
            aria-label="Your answer"
          />
        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.bottomBar}>
        <button className={styles.saveProgressBtn}>Save Progress</button>
      </div>
    </div>
  );
}

function ScoreBreakdown({ scores }: { scores: QuestionAttempt['scores'] }) {
  if (!scores) return null;
  const rows: Array<[string, number]> = [
    ['Issue Identification', scores.issueIdentification],
    ['Rule Statement', scores.ruleStatement],
    ['Application', scores.application],
    ['Conclusion', scores.conclusion],
  ];
  return (
    <div className={styles.scoreBreakdown}>
      {rows.map(([label, val]) => (
        <div key={label} className={styles.scoreRow}>
          <span>{label}</span>
          <strong
            className={`${styles.scoreVal} ${val >= 20 ? styles.scoreValHigh : val >= 12 ? styles.scoreValMedium : styles.scoreValLow}`}
          >
            {val}/25
          </strong>
        </div>
      ))}
    </div>
  );
}
