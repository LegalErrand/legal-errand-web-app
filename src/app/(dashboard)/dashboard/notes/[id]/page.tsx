'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getNote, updateNote, analyzeNote, summarizeNote, getFetchErrorMessage } from '@/lib/api';
import { getAccessToken } from '@/lib/authStorage';
import type { Note } from '@/lib/types';
import NoteEditor from './NoteEditor';
import NoteAISidebar from './NoteAISidebar';
import styles from './page.module.scss';

export default function NoteWorkspacePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');
  const [token, setToken] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const t = getAccessToken();
    if (!t) { router.replace('/login'); return; }
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

  const handleSave = useCallback(async (title: string, content: string) => {
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
  }, [token, id]);

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

  if (loading) return <div className={styles.page}><p className={styles.state}>Loading note…</p></div>;
  if (!note) return <div className={styles.page}><p className={styles.state}>Note not found.</p></div>;

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <Link href="/dashboard/notes" className={styles.backBtn}>← Notes</Link>
        <div className={styles.headerCenter}>
          {saving && <span className={styles.savingLabel}>Saving…</span>}
          {saveErr && <span className={styles.saveErrLabel}>{saveErr}</span>}
        </div>
        <button className={styles.aiBtn} onClick={() => setSidebarOpen((o) => !o)}>
          {sidebarOpen ? 'Close AI' : '✦ AI Tools'}
        </button>
      </header>

      <div className={`${styles.workspace} ${sidebarOpen ? styles.withSidebar : ''}`}>
        <NoteEditor note={note} onSave={handleSave} />
        {sidebarOpen && (
          <NoteAISidebar onAnalyze={handleAnalyze} onSummarize={handleSummarize} qualityScore={note.qualityScore} qualityFeedback={note.qualityFeedback} />
        )}
      </div>
    </div>
  );
}
