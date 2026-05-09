'use client';

import { useState } from 'react';
import type { NoteAnalysis } from '@/lib/types';
import styles from './NoteAISidebar.module.scss';

interface Props {
  qualityScore?: number;
  qualityFeedback?: string;
  onAnalyze: () => Promise<NoteAnalysis | null>;
  onSummarize: () => Promise<string | null>;
}

export default function NoteAISidebar({ qualityScore, qualityFeedback, onAnalyze, onSummarize }: Props) {
  const [score, setScore] = useState<number | undefined>(qualityScore);
  const [feedback, setFeedback] = useState<string | undefined>(qualityFeedback);
  const [summary, setSummary] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [error, setError] = useState('');

  async function handleAnalyze() {
    setAnalyzing(true);
    setError('');
    try {
      const res = await onAnalyze();
      if (res) { setScore(res.qualityScore); setFeedback(res.qualityFeedback); }
    } catch { setError('Analysis failed. Try again.'); }
    finally { setAnalyzing(false); }
  }

  async function handleSummarize() {
    setSummarizing(true);
    setError('');
    try {
      const res = await onSummarize();
      if (res) setSummary(res);
    } catch { setError('Summarization failed. Try again.'); }
    finally { setSummarizing(false); }
  }

  return (
    <aside className={styles.sidebar}>
      <h2 className={styles.sidebarTitle}>✦ AI Tools</h2>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.toolSection}>
        <h3 className={styles.toolTitle}>Quality Analysis</h3>
        {score !== undefined && (
          <div className={styles.scoreWrap}>
            <div className={styles.scoreTrack}>
              <div className={styles.scoreFill} style={{ width: `${score}%` }} />
            </div>
            <span className={styles.scoreLabel}>{score}%</span>
          </div>
        )}
        {feedback && <p className={styles.feedbackText}>{feedback}</p>}
        <button className={styles.toolBtn} onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? 'Analysing…' : 'Analyse Note'}
        </button>
      </div>

      <div className={styles.toolSection}>
        <h3 className={styles.toolTitle}>AI Summary</h3>
        {summary && <p className={styles.summaryText}>{summary}</p>}
        <button className={styles.toolBtn} onClick={handleSummarize} disabled={summarizing}>
          {summarizing ? 'Summarising…' : 'Summarise Note'}
        </button>
      </div>
    </aside>
  );
}
