import Link from 'next/link';
import type { Note } from '@/lib';
import styles from './page.module.scss';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export function NoteCard({ note, onDelete }: { note: Note; onDelete: (id: string) => void }) {
  const score = note.qualityScore;
  const hasScore = typeof score === 'number' && score > 0;
  const circumference = 2 * Math.PI * 18;
  const offset = hasScore ? circumference - (score / 100) * circumference : circumference;

  return (
    <div className={styles.noteCard}>
      <div className={styles.noteCardTopRow}>
        {note.subject && <span className={styles.noteSubjectBadge}>{note.subject}</span>}
        {hasScore && (
          <div className={styles.scoreWrap}>
            <div className={styles.scoreCircle} title={`${score}% AI score`}>
              <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
                <circle cx="22" cy="22" r="18" fill="none" stroke="#F3F4F6" strokeWidth="4" />
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke="#D97706"
                  strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  transform="rotate(-90 22 22)"
                />
              </svg>
              <span className={styles.scoreText}>{score}%</span>
            </div>
            <span className={styles.scoreLabel}>AI score</span>
          </div>
        )}
      </div>
      <Link href={`/dashboard/notes/${note.id}`} className={styles.noteLink}>
        <h3 className={styles.noteTitle}>{note.title}</h3>
        {note.content && (
          <p className={styles.noteExcerpt}>
            {note.content.replace(/<[^>]+>/g, '').slice(0, 120)}…
          </p>
        )}
        <p className={styles.noteDate}>{timeAgo(note.createdAt)}</p>
      </Link>
      <button
        className={styles.deleteNoteBtn}
        onClick={() => onDelete(note.id)}
        aria-label="Delete note"
      >
        ✕
      </button>
    </div>
  );
}
