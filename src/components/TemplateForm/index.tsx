import CaseBriefForm from './CaseBriefForm';
import IracForm from './IracForm';
import StatuteForm from './StatuteForm';
import ResearchMemoForm from './ResearchMemoForm';
import LectureNotesForm from './LectureNotesForm';
import NoteEditor from '../NoteEditor';
import type { Note } from '@/lib';

interface Props {
  note: Note;
  onSave: (title: string, content: string) => Promise<void>;
  pendingInsert?: string;
  onInsertApplied?: () => void;
}

function detectTemplate(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('case brief') || t.includes('case note')) return 'case-brief';
  if (t.includes('irac')) return 'irac';
  if (t.includes('statute')) return 'statute';
  if (t.includes('research memo') || t.includes('research...')) return 'research';
  if (t.includes('lecture')) return 'lecture';
  return 'blank';
}

export default function TemplateForm({ note, onSave, pendingInsert, onInsertApplied }: Props) {
  const type = detectTemplate(note.title);
  const commonProps = {
    title: note.title,
    content: note.content,
    onSave: (t: string, c: string) => { void onSave(t, c); },
    pendingInsert,
    onInsertApplied,
  };
  if (type === 'case-brief') return <CaseBriefForm {...commonProps} />;
  if (type === 'irac') return <IracForm {...commonProps} />;
  if (type === 'statute') return <StatuteForm {...commonProps} />;
  if (type === 'research') return <ResearchMemoForm {...commonProps} />;
  if (type === 'lecture') return <LectureNotesForm {...commonProps} />;
  return <NoteEditor note={note} onSave={onSave} pendingInsert={pendingInsert} onInsertApplied={onInsertApplied} />;
}
