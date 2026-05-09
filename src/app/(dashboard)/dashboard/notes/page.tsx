'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getNotes, getNoteTemplates, createNote, deleteNote, getFetchErrorMessage } from '@/lib/api';
import { getAccessToken } from '@/lib/authStorage';
import type { Note, NoteTemplate } from '@/lib/types';
import styles from './page.module.scss';

export default function NotesPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const loadNotes = useCallback(async (t: string, q: string) => {
    setLoading(true);
    try {
      const params = q ? { search: q, limit: 30 } : { limit: 30 };
      const res = await getNotes(t, params);
      setNotes(res.data?.data ?? []);
    } catch (err) {
      setError(getFetchErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = getAccessToken();
    if (!t) { router.replace('/login'); return; }
    setToken(t);
    void Promise.all([
      loadNotes(t, ''),
      getNoteTemplates(t).then((r) => setTemplates(r.data ?? [])).catch(() => {}),
    ]);
  }, [router, loadNotes]);

  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(() => void loadNotes(token, search), 400);
    return () => clearTimeout(timer);
  }, [search, token, loadNotes]);

  async function handleCreateBlank() {
    if (!token) return;
    setCreating(true);
    setError('');
    try {
      const res = await createNote({ title: 'Untitled Note', content: '' }, token);
      if (res.data?.id) router.push(`/dashboard/notes/${res.data.id}`);
      else setError(res.message ?? 'Could not create note');
    } catch (err) {
      setError(getFetchErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  async function handleCreateFromTemplate(t: NoteTemplate) {
    if (!token) return;
    setCreating(true);
    setError('');
    try {
      const res = await createNote({ title: t.name, content: t.content }, token);
      if (res.data?.id) router.push(`/dashboard/notes/${res.data.id}`);
      else setError(res.message ?? 'Could not create note');
    } catch (err) {
      setError(getFetchErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!token || !confirm('Delete this note?')) return;
    try {
      await deleteNote(id, token);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      setError(getFetchErrorMessage(err));
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <h1 className={styles.pageTitle}>Notes</h1>
        <button className={styles.newBtn} onClick={handleCreateBlank} disabled={creating}>
          {creating ? 'Creating…' : '+ New Note'}
        </button>
      </header>

      <div className={styles.content}>
        {error && <p className={styles.error} role="alert">{error}</p>}

        {templates.length > 0 && (
          <section>
            <h2 className={styles.sectionTitle}>Templates</h2>
            <div className={styles.templateGrid}>
              {templates.map((t) => (
                <button key={t.id} className={styles.templateCard} onClick={() => handleCreateFromTemplate(t)}>
                  <span className={styles.templateName}>{t.name}</span>
                  {t.description && <span className={styles.templateDesc}>{t.description}</span>}
                </button>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className={styles.notesHeader}>
            <h2 className={styles.sectionTitle}>My Notes</h2>
            <div className={styles.searchWrap}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={styles.searchIcon}>
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8" />
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input className={styles.searchInput} placeholder="Search notes…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <p className={styles.stateMsg}>Loading…</p>
          ) : notes.length === 0 ? (
            <div className={styles.emptyBox}>
              <p>No notes yet. Create your first note above.</p>
            </div>
          ) : (
            <div className={styles.noteGrid}>
              {notes.map((note) => (
                <div key={note.id} className={styles.noteCard}>
                  <Link href={`/dashboard/notes/${note.id}`} className={styles.noteLink}>
                    <h3 className={styles.noteTitle}>{note.title}</h3>
                    {note.subject && <span className={styles.noteMeta}>{note.subject}</span>}
                    {note.qualityScore !== undefined && (
                      <div className={styles.scoreWrap}>
                        <div className={styles.scoreTrack}>
                          <div className={styles.scoreFill} style={{ width: `${note.qualityScore}%` }} />
                        </div>
                        <span className={styles.scoreLabel}>{note.qualityScore}%</span>
                      </div>
                    )}
                    <p className={styles.noteDate}>{new Date(note.createdAt).toLocaleDateString()}</p>
                  </Link>
                  <button className={styles.deleteNoteBtn} onClick={() => handleDelete(note.id)} aria-label="Delete note" title="Delete">✕</button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
