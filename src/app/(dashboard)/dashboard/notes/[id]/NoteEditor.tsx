'use client';

import { useState, useEffect, useRef } from 'react';
import type { Note } from '@/lib/types';
import styles from './NoteEditor.module.scss';

interface Props {
  note: Note;
  onSave: (title: string, content: string) => Promise<void>;
}

export default function NoteEditor({ note, onSave }: Props) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
  }, [note.id, note.title, note.content]);

  function scheduleAutoSave(nextTitle: string, nextContent: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void onSave(nextTitle, nextContent);
    }, 1200);
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value);
    scheduleAutoSave(e.target.value, content);
  }

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);
    scheduleAutoSave(title, e.target.value);
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div className={styles.editor}>
      <input
        className={styles.titleInput}
        value={title}
        onChange={handleTitleChange}
        placeholder="Note title…"
        aria-label="Note title"
      />
      <div className={styles.meta}>
        {note.subject && <span className={styles.metaTag}>{note.subject}</span>}
        {note.tags?.map((tag) => <span key={tag} className={styles.metaTag}>#{tag}</span>)}
      </div>
      <textarea
        className={styles.contentArea}
        value={content}
        onChange={handleContentChange}
        placeholder="Start writing your note…"
        aria-label="Note content"
      />
    </div>
  );
}
