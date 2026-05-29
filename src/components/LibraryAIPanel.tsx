'use client';
import { useState } from 'react';
import { sendAiChat, getAccessToken } from '@/lib';
import styles from './LibraryAIPanel.module.scss';

interface Props {
  docTitle: string;
  docSubject?: string;
}

export default function LibraryAIPanel({ docTitle, docSubject }: Props) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<'A' | 'B' | null>(null);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;
    setLoading(true);
    setAnswer('');
    try {
      const token = getAccessToken() ?? '';
      const contextPrefix = `[Re: ${docTitle}${docSubject ? ` (${docSubject})` : ''}] `;
      const res = await sendAiChat({ message: contextPrefix + q }, token);
      setAnswer(res.data?.reply ?? 'No response received.');
    } catch {
      setAnswer('Could not get a response. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const quizQuestion = `Which of the following best describes the legal principle discussed in "${docTitle}"?`;
  const optionA = `It establishes a precedent for ${docSubject ?? 'legal proceedings'} in Nigerian courts.`;
  const optionB = `It applies only to administrative proceedings and has no bearing on civil matters.`;

  return (
    <aside className={styles.aiPanel}>
      <div className={styles.aiPanelHeader}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 2l3 7h7l-5.5 4 2 7L12 17l-6.5 3 2-7L2 9h7l3-7z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
        <span className={styles.aiPanelTitle}>Legal AI</span>
      </div>

      <div className={styles.aiSection}>
        <p className={styles.aiSectionLabel}>AI SUMMARY</p>
        <p className={styles.aiSummaryText}>
          {docTitle} covers key provisions in {docSubject ?? 'Nigerian Law'}. Ask the AI below for a
          detailed summary or analysis.
        </p>
      </div>

      <div className={styles.aiSection}>
        <p className={styles.aiSectionLabel}>QUICK QUIZ</p>
        <p className={styles.quizQuestion}>{quizQuestion}</p>
        <div className={styles.quizOptions}>
          {(['A', 'B'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              className={`${styles.quizOption} ${quizAnswer === opt ? styles.quizOptionSelected : ''}`}
              onClick={() => setQuizAnswer(opt)}
            >
              <span className={styles.quizLetter}>{opt}</span>
              <span>{opt === 'A' ? optionA : optionB}</span>
            </button>
          ))}
        </div>
        {quizAnswer && (
          <p className={styles.quizFeedback}>
            {quizAnswer === 'A'
              ? 'Correct! Well done.'
              : 'Not quite — try reviewing the document summary.'}
          </p>
        )}
      </div>

      {answer && (
        <div className={styles.aiSection}>
          <p className={styles.aiSectionLabel}>AI RESPONSE</p>
          <p className={styles.aiAnswerText}>{answer}</p>
        </div>
      )}

      <form className={styles.aiChatForm} onSubmit={handleAsk}>
        <textarea
          className={styles.aiChatInput}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask Legal AI a question about this document..."
          rows={3}
        />
        <button type="submit" className={styles.aiSendBtn} disabled={loading || !question.trim()}>
          {loading ? 'Asking…' : 'Ask AI'}
        </button>
      </form>
    </aside>
  );
}
