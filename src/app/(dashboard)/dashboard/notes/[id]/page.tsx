'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  getNote,
  updateNote,
  analyzeNote,
  summarizeNote,
  expandNote,
  getFetchErrorMessage,
  getAccessToken,
} from '@/lib';
import type { Note } from '@/lib';
import TemplateForm from '@/components/TemplateForm';
import NoteAISidebar from '@/components/NoteAISidebar';
import styles from './page.module.scss';

export default function NoteWorkspacePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');
  const [token, setToken] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Text queued for insertion into the editor by the AI sidebar
  const [pendingInsert, setPendingInsert] = useState<string | undefined>(undefined);

  useEffect(() => {
    const t = getAccessToken();
    if (!t) {
      router.replace('/login');
      return;
    }
    setToken(t);
    if (!id) return;
    void (async () => {
      try {
        const res = await getNote(id, t);
        if (res.data) setNote(res.data);
      } catch (err) {
        setSaveErr(getFetchErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [router, id]);

  const handleSave = useCallback(
    async (title: string, content: string) => {
      if (!token || !id) return;
      setSaving(true);
      setSaveErr('');
      try {
        const res = await updateNote(id, { title, content }, token);
        if (res.data) setNote(res.data);
      } catch (err) {
        setSaveErr(getFetchErrorMessage(err));
      } finally {
        setSaving(false);
      }
    },
    [token, id]
  );

  const handleAnalyze = useCallback(async () => {
    if (!token || !id) return null;
    const res = await analyzeNote(id, token);
    return res.data ?? null;
  }, [token, id]);

  const handleSummarize = useCallback(async () => {
    if (!token || !id) return null;
    const res = await summarizeNote(id, token);
    return res.data?.summary ?? null;
  }, [token, id]);

  const handleExpand = useCallback(async () => {
    if (!token || !id) return null;
    const res = await expandNote(id, token);
    return res.data?.expanded ?? null;
  }, [token, id]);

  // Persist score/feedback changes from sidebar back to note state
  const handleScoreChange = useCallback((score: number, feedback: string) => {
    setNote((prev) => (prev ? { ...prev, qualityScore: score, qualityFeedback: feedback } : prev));
  }, []);

  if (loading)
    return (
      <div className={styles.page}>
        <p className={styles.state}>Loading note…</p>
      </div>
    );
  if (!note)
    return (
      <div className={styles.page}>
        <p className={styles.state}>Note not found.</p>
      </div>
    );

  // Derive template name from note title for breadcrumb
  const templateName = note.title || 'Note';

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <Link href="/dashboard/notes" className={styles.breadcrumb}>
          <span>Smart Note</span>
          <span className={styles.breadSep}>›</span>
          <span className={styles.breadCurrent}>{templateName}</span>
        </Link>
        <div className={styles.headerActions}>
          {saving && <span className={styles.savingLabel}>Saving…</span>}
          {saveErr && <span className={styles.saveErrLabel}>{saveErr}</span>}
          <button className={styles.exportBtn}>Export</button>
          <button
            className={styles.saveNoteBtn}
            onClick={() => handleSave(note.title, note.content)}
            disabled={saving}
          >
            Save Note
          </button>
          <button className={styles.bellBtn} aria-label="Notifications">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button className={styles.avatarBtn} aria-label="User menu" />
        </div>
      </header>

      <div className={`${styles.workspace} ${styles.withSidebar}`}>
        {/* Left template list */}
        <div className={styles.templateSidebar}>
          <p className={styles.templateSidebarHeading}>Notes Templates</p>
          {[
            { slug: 'case-brief', name: 'Case Brief', sub: '7 section case analysis' },
            { slug: 'irac', name: 'IRAC brief', sub: 'Legal reasoning framework' },
            { slug: 'statute', name: 'Statute summary', sub: 'Provision-by-provision' },
            { slug: 'research', name: 'Research memo', sub: 'findings, source & gaps' },
            { slug: 'lecture', name: 'Lecture Notes', sub: 'lecture capture' },
          ].map((tpl) => (
            <button key={tpl.slug} className={styles.templateItem}>
              <div className={styles.templateItemIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </div>
              <div className={styles.templateItemText}>
                <span className={styles.templateItemName}>{tpl.name}</span>
                <span className={styles.templateItemSub}>{tpl.sub}</span>
              </div>
            </button>
          ))}
        </div>

        <TemplateForm
          note={note}
          onSave={handleSave}
          pendingInsert={pendingInsert}
          onInsertApplied={() => setPendingInsert(undefined)}
        />
        {sidebarOpen && (
          <NoteAISidebar
            qualityScore={note.qualityScore}
            qualityFeedback={note.qualityFeedback}
            onAnalyze={handleAnalyze}
            onSummarize={handleSummarize}
            onExpand={handleExpand}
            onInsertContent={(text) => setPendingInsert(text)}
            onScoreChange={handleScoreChange}
          />
        )}
      </div>
    </div>
  );
}
