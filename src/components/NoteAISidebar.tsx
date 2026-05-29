'use client';

import { useState } from 'react';
import type { NoteAnalysis } from "@/lib";
import styles from './NoteAISidebar.module.scss';

interface AISuggestion {
  title: string;
  body: string;
  type: 'warning' | 'info' | 'success';
}

interface Props {
  qualityScore?: number;
  qualityFeedback?: string;
  onAnalyze: () => Promise<NoteAnalysis | null>;
  onSummarize: () => Promise<string | null>;
  onExpand: () => Promise<string | null>;
  onInsertContent: (text: string) => void;
  onScoreChange?: (score: number, feedback: string) => void;
}

function parseFeedback(feedback: string): AISuggestion[] {
  return feedback
    .split(/\n|\.(?=\s)/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 4)
    .map((line) => ({ title: 'AI Suggestion', body: line, type: 'info' as const }));
}

function ScoreDonut({ score }: { score: number }) {
  const r = 44;
  const cx = 56;
  const cy = 56;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#16A34A' : score >= 50 ? '#D97706' : '#6B7280';
  return (
    <div className={styles.donutWrap}>
      <svg width="112" height="112" viewBox="0 0 112 112" aria-hidden="true">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F3F4F6" strokeWidth="10" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
          className={styles.donutArc}
        />
      </svg>
      <div className={styles.donutLabel}>
        <span className={`${styles.donutPct} ${score >= 80 ? styles.donutPctHigh : score >= 50 ? styles.donutPctMed : styles.donutPctLow}`}>{score > 0 ? `${score}%` : '—'}</span>
      </div>
    </div>
  );
}

export default function NoteAISidebar({
  qualityScore, qualityFeedback, onAnalyze, onSummarize, onExpand, onInsertContent, onScoreChange,
}: Props) {
  const [score, setScore] = useState<number>(qualityScore ?? 0);
  const [feedback, setFeedback] = useState<string>(qualityFeedback ?? '');
  const [summary, setSummary] = useState<string>('');
  const [expanded, setExpanded] = useState<string>('');
  const [suggestions, setSuggestions] = useState<AISuggestion[]>(() =>
    qualityFeedback ? parseFeedback(qualityFeedback) : []
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const [error, setError] = useState('');

  async function handleAnalyze() {
    setAnalyzing(true);
    setError('');
    try {
      const res = await onAnalyze();
      if (res) {
        setScore(res.qualityScore);
        setFeedback(res.qualityFeedback);
        setSuggestions(parseFeedback(res.qualityFeedback));
        onScoreChange?.(res.qualityScore, res.qualityFeedback);
      }
    } catch {
      setError('Analysis failed. Try again.');
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSummarize() {
    setSummarizing(true);
    setError('');
    try {
      const res = await onSummarize();
      if (res) setSummary(res);
    } catch {
      setError('Summarization failed. Try again.');
    } finally {
      setSummarizing(false);
    }
  }

  async function handleExpand() {
    setExpanding(true);
    setError('');
    try {
      const res = await onExpand();
      if (res) setExpanded(res);
    } catch {
      setError('Expansion failed. Try again.');
    } finally {
      setExpanding(false);
    }
  }

  const hasAnalysis = score > 0 || suggestions.length > 0;

  return (
    <aside className={styles.sidebar}>
      {error && <p className={styles.error} role="alert">{error}</p>}

      {/* Quality Analysis */}
      <div className={styles.panel}>
        <h3 className={styles.panelTitle}>Quality Analysis</h3>
        <div className={styles.donutSection}>
          <ScoreDonut score={score} />
        </div>
        {!hasAnalysis ? (
          <p className={styles.hintText}>
            Run an analysis to receive AI quality scoring and improvement suggestions.
          </p>
        ) : (
          feedback && <p className={styles.feedbackText}>{feedback}</p>
        )}
        <button className={styles.analyzeBtn} onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? 'Analysing…' : 'Analyse Note'}
        </button>
      </div>

      {/* Legal AI Insights */}
      <div className={styles.panel}>
        <h3 className={styles.panelTitle}>Legal AI Insights</h3>

        {!hasAnalysis ? (
          <div className={styles.suggestionCard}>
            <p className={styles.suggestionLabel}>AI SUGGESTION</p>
            <p className={styles.suggestionBody}>
              Fill in at least one section of your note and run an analysis — AI will identify missing legal principles and suggest improvements.
            </p>
          </div>
        ) : (
          <div className={styles.suggestionList}>
            {suggestions.map((s, i) => (
              <div key={i} className={`${styles.suggestionCard} ${styles[`suggestion_${s.type}`]}`}>
                <p className={styles.suggestionLabel}>{s.title.toUpperCase()}</p>
                <p className={styles.suggestionBody}>{s.body}</p>
              </div>
            ))}
          </div>
        )}

        <div className={styles.insightActions}>
          <button className={styles.summarizeBtn} onClick={handleSummarize} disabled={summarizing}>
            {summarizing ? 'Summarising…' : 'Summarise Note'}
          </button>
          <button className={styles.summarizeBtn} onClick={handleExpand} disabled={expanding}>
            {expanding ? 'Expanding…' : 'Expand Note'}
          </button>
        </div>

        {summary && (
          <div className={styles.summaryBox}>
            <p className={styles.summaryLabel}>SUMMARY</p>
            <p className={styles.summaryText}>{summary}</p>
            <button className={styles.insertBtn} onClick={() => onInsertContent(summary)}>Insert into note</button>
          </div>
        )}

        {expanded && (
          <div className={styles.summaryBox}>
            <p className={styles.summaryLabel}>EXPANDED CONTENT</p>
            <p className={styles.summaryText}>{expanded}</p>
            <button className={styles.insertBtn} onClick={() => onInsertContent(expanded)}>Insert into note</button>
          </div>
        )}
      </div>
    </aside>
  );
}
