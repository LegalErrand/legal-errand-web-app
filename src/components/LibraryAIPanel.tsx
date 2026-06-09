'use client';
import { useEffect, useState } from 'react';
import { sendAiChat, getAccessToken, useTypewriter } from '@/lib';
import { Spinner } from '@/components';
import styles from './LibraryAIPanel.module.scss';

interface Props {
  docTitle: string;
  docSubject?: string;
  docDescription?: string;
}

function renderMarkdown(md: string): string {
  return md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^\|.*\|$/gm, (row) =>
      row
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim())
        .filter(Boolean)
        .join(' · ')
    )
    .replace(/^\|[-: |]+\|$/gm, '')
    .replace(/^#{1,2}\s+(.+)$/gm, '<strong>$1</strong>')
    .replace(/^#{3,6}\s+(.+)$/gm, '<em>$1</em>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^---+$/gm, '')
    .replace(/\n{2,}/g, '\n\n')
    .trim();
}

async function askAI(message: string, token: string): Promise<string> {
  const res = await sendAiChat({ message }, token);
  return res.data?.reply ?? '';
}

/** Renders text with typewriter animation, then shows full text when done */
function TypewriterText({ text, className }: { text: string; className?: string }) {
  const { displayed, done } = useTypewriter(text, 8, 12);
  return (
    <p className={className}>
      {displayed}
      {!done && <span className={styles.cursor} aria-hidden="true" />}
    </p>
  );
}

export default function LibraryAIPanel({ docTitle, docSubject, docDescription }: Props) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [quizAnswer, setQuizAnswer] = useState<'A' | 'B' | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setSummaryLoading(false);
      return;
    }

    const context = docDescription
      ? `"${docTitle}" — ${docDescription}`
      : `"${docTitle}"${docSubject ? ` (${docSubject})` : ''}`;

    setSummaryLoading(true);
    askAI(
      `In 2–3 concise sentences, summarise the legal significance of the Nigerian case ${context}. Focus on what was decided and why it matters. Only include facts from the case record — do not invent details. No markdown.`,
      token
    )
      .then((text) => setSummary(text))
      .catch(() => setSummary(''))
      .finally(() => setSummaryLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docTitle]);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;
    setLoading(true);
    setAnswer('');
    try {
      const token = getAccessToken() ?? '';
      const msg = `[Document: "${docTitle}"${docSubject ? ` — ${docSubject}` : ''}] ${q}`;
      const reply = await askAI(msg, token);
      setAnswer(reply || 'No response received.');
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
      <div className={styles.aiScrollable}>
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
          {summaryLoading ? (
            <div className={styles.loadingRow}>
              <Spinner size={14} />
              <span className={styles.aiSummaryLoading}>Generating summary…</span>
            </div>
          ) : summary ? (
            <TypewriterText text={summary} className={styles.aiSummaryText} />
          ) : (
            <p className={styles.aiSummaryText}>
              {docTitle} — ask the AI below for a summary or analysis.
            </p>
          )}
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
            <TypewriterText text={answer} className={styles.aiAnswerPlain} />
          </div>
        )}
      </div>

      <form className={styles.aiChatForm} onSubmit={handleAsk}>
        <textarea
          className={styles.aiChatInput}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask Legal AI a question about this document..."
          rows={3}
        />
        <button type="submit" className={styles.aiSendBtn} disabled={loading || !question.trim()}>
          {loading ? (
            <span className={styles.btnLoading}>
              <Spinner size={14} light /> Asking…
            </span>
          ) : (
            'Ask AI'
          )}
        </button>
      </form>
    </aside>
  );
}
