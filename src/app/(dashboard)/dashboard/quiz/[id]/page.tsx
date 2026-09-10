'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getQuestion, submitAnswer, getFetchErrorMessage, getAccessToken } from '@/lib';
import type { Question, QuestionAttempt, QuestionSubmitResult } from '@/lib';
import { Spinner } from '@/components';
import styles from './page.module.scss';

const IRAC_PLACEHOLDER = `Issue:
Identify the legal issue(s) raised by the facts.

Rule:
State the applicable Nigerian law / authorities.

Application:
Apply the rules to these facts.

Conclusion:
State your conclusion clearly.`;

function normalizeAttempt(
  data: QuestionAttempt | QuestionSubmitResult | undefined
): QuestionAttempt | null {
  if (!data) return null;
  if ('attempt' in data || 'gradingResult' in data) {
    const nested = data as QuestionSubmitResult;
    const attempt = nested.attempt;
    if (!attempt) return null;
    return {
      ...attempt,
      id: attempt.id || attempt._id || '',
      scores: attempt.scores ?? nested.gradingResult?.scores ?? attempt.scores,
      aiFeedback:
        attempt.aiFeedback || nested.gradingResult?.feedback?.overall || attempt.aiFeedback || '',
      modelAnswer: attempt.modelAnswer || nested.gradingResult?.modelAnswerHints,
    };
  }
  return data as QuestionAttempt;
}

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

    if (!id || id === 'undefined') {
      setError('Invalid question link. Go back to the question bank and try again.');
      setLoading(false);
      return;
    }

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
      const attempt = normalizeAttempt(res.data);
      if (attempt) {
        setResult(attempt);
      } else {
        setError(res.message ?? 'Submission failed. Please try again.');
      }
    } catch (err) {
      setError(getFetchErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.stateMsg}>
          <Spinner size={22} label="Loading question…" />
        </div>
      </div>
    );
  }

  if (result) {
    const total = result.scores?.total ?? 0;
    const passed = total >= 50;
    const scoreColor = passed ? '#16a34a' : '#d97706';
    return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <nav className={styles.breadcrumb} aria-label="breadcrumb">
            <Link href="/dashboard/reasoning" className={styles.breadLink}>
              Question Bank
            </Link>
            <span className={styles.breadSep}>›</span>
            <span className={styles.breadCurrent}>Result</span>
          </nav>
        </div>
        <div className={styles.resultScroll}>
          <div className={styles.resultCard}>
            <h2 className={styles.resultTitle}>AI Grading Result (IRAC)</h2>
            <p className={styles.resultScore} style={{ color: scoreColor }}>
              Score: <strong>{total}/100</strong>
            </p>

            {result.scores && (
              <div className={styles.scoreChips}>
                <div className={styles.scoreChip}>
                  <span className={styles.scoreChipLabel}>Issue</span>
                  <span className={styles.scoreChipVal}>
                    {result.scores.issueIdentification}/25
                  </span>
                </div>
                <div className={styles.scoreChip}>
                  <span className={styles.scoreChipLabel}>Rule</span>
                  <span className={styles.scoreChipVal}>{result.scores.ruleStatement}/25</span>
                </div>
                <div className={styles.scoreChip}>
                  <span className={styles.scoreChipLabel}>Application</span>
                  <span className={styles.scoreChipVal}>{result.scores.application}/35</span>
                </div>
                <div className={styles.scoreChip}>
                  <span className={styles.scoreChipLabel}>Conclusion</span>
                  <span className={styles.scoreChipVal}>{result.scores.conclusion}/15</span>
                </div>
              </div>
            )}

            {result.aiFeedback && (
              <div className={styles.feedbackBlock}>
                <h3 className={styles.feedbackTitle}>AI Feedback</h3>
                <p className={styles.feedbackText}>{result.aiFeedback}</p>
              </div>
            )}

            {result.modelAnswer && (
              <div className={styles.modelAnswerBlock}>
                <h3 className={styles.feedbackTitle}>Model answer hints</h3>
                <div className={styles.modelAnswerBox}>
                  {result.modelAnswer
                    .split('\n')
                    .filter(Boolean)
                    .map((line, i) => (
                      <p key={i} className={styles.modelAnswerLine}>
                        {line}
                      </p>
                    ))}
                </div>
              </div>
            )}

            <div className={styles.resultActions}>
              <Link href="/dashboard/reasoning" className={styles.backToBank}>
                ← Back to Question Bank
              </Link>
              <button
                type="button"
                className={styles.tryAgainBtn}
                onClick={() => {
                  setResult(null);
                  setAnswer('');
                  setError('');
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className={styles.page}>
        <p className={styles.stateMsg}>{error || 'Question not found.'}</p>
        <div className={styles.bottomBar}>
          <Link href="/dashboard/reasoning" className={styles.prevBtn}>
            ← Question bank
          </Link>
        </div>
      </div>
    );
  }

  const promptText = (question.prompt ?? question.text ?? '').trim();
  const scenarioText = (question.scenario ?? '').trim();
  const showScenario = Boolean(scenarioText && scenarioText !== promptText);

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <nav className={styles.breadcrumb} aria-label="breadcrumb">
          <Link href="/dashboard/reasoning" className={styles.breadLink}>
            Quizzes
          </Link>
          <span className={styles.breadSep}>›</span>
          <span className={styles.breadCurrent}>{question.subject || 'Practice'}</span>
        </nav>
        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={submitting || !answer.trim()}
        >
          {submitting ? (
            <span className={styles.btnLoading}>
              <Spinner size={15} light /> Submitting…
            </span>
          ) : (
            'Submit for AI Grading'
          )}
        </button>
      </div>

      {error && (
        <p className={styles.errorMsg} role="alert">
          {error}
        </p>
      )}

      <div className={styles.split}>
        <div className={styles.casePanel}>
          <div className={styles.caseCard}>
            <p className={styles.iracHint}>
              Answer using IRAC (Issue · Rule · Application · Conclusion)
            </p>
            <h2 className={styles.caseTitle}>{question.subject ?? 'Legal scenario'}</h2>
            {showScenario && (
              <div className={styles.caseText}>
                {scenarioText
                  .split('\n')
                  .map((para, i) => (para.trim() ? <p key={i}>{para.trim()}</p> : null))}
              </div>
            )}
            <div className={styles.questionBox}>
              <p className={styles.questionLabel}>Question</p>
              <p className={styles.questionText}>
                {promptText || 'Answer the question in the workspace.'}
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
                Back
              </Link>
            </div>
          </div>
        </div>

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
            <span className={styles.workspaceTitle}>IRAC workspace</span>
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
            <button
              className={styles.toolBtnWide}
              type="button"
              onClick={() => {
                if (!answer.trim()) setAnswer(IRAC_PLACEHOLDER);
              }}
              title="Insert IRAC outline"
            >
              Insert IRAC
            </button>
          </div>
          <textarea
            ref={textareaRef}
            className={styles.workspace}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={IRAC_PLACEHOLDER}
            aria-label="Your IRAC answer"
          />
        </div>
      </div>

      <div className={styles.bottomBar}>
        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={submitting || !answer.trim()}
          type="button"
        >
          {submitting ? 'Submitting…' : 'Submit for AI Grading'}
        </button>
      </div>
    </div>
  );
}
