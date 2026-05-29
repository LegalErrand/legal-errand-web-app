'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Note } from "@/lib";
import styles from './NoteEditor.module.scss';

interface Props {
  note: Note;
  onSave: (title: string, content: string) => Promise<void>;
  pendingInsert?: string;
  onInsertApplied?: () => void;
}

export default function NoteEditor({ note, onSave, pendingInsert, onInsertApplied }: Props) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
  }, [note.id, note.title, note.content]);

  // When parent wants to insert text (from AI sidebar), append it
  useEffect(() => {
    if (!pendingInsert) return;
    setContent((prev) => {
      const sep = prev.trim() ? '\n\n' : '';
      const next = prev + sep + pendingInsert;
      scheduleAutoSave(title, next);
      return next;
    });
    onInsertApplied?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingInsert]);

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

  const handleFormat = useCallback((fmt: 'bold' | 'italic' | 'heading' | 'list') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = ta.value.slice(start, end);
    let replacement = '';
    if (fmt === 'bold')    replacement = `**${sel || 'bold text'}**`;
    else if (fmt === 'italic')  replacement = `_${sel || 'italic text'}_`;
    else if (fmt === 'heading') replacement = `\n## ${sel || 'Heading'}\n`;
    else replacement = (sel || 'item').split('\n').map((l) => `• ${l}`).join('\n');
    const next = ta.value.slice(0, start) + replacement + ta.value.slice(end);
    setContent(next);
    scheduleAutoSave(title, next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + replacement.length, start + replacement.length);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div className={styles.editor}>
      <div className={styles.editorInner}>
        <div className={styles.toolbar}>
          <button className={styles.toolBtn} type="button" title="Bold"   onClick={() => handleFormat('bold')}><strong>B</strong></button>
          <button className={styles.toolBtn} type="button" title="Italic" onClick={() => handleFormat('italic')}><em>I</em></button>
          <button className={styles.toolBtn} type="button" title="List"   onClick={() => handleFormat('list')}>≡</button>
        </div>
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
          ref={textareaRef}
          className={styles.contentArea}
          value={content}
          onChange={handleContentChange}
          placeholder="Start writing your note…"
          aria-label="Note content"
        />
      </div>
    </div>
  );
}
