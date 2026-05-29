'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getNotes, getNoteTemplates, createNote, deleteNote, getFetchErrorMessage, getAccessToken } from "@/lib";
import type { Note, NoteTemplate } from "@/lib";
import styles from './page.module.scss';

// ─── Static template definitions ──────────────────────────────────────────────

const STATIC_TEMPLATES = [
  { slug: 'blank',      label: 'Blank Note',       desc: 'Start from a clean slate for custom research or unique drafting requirements.', category: '' },
  { slug: 'irac',       label: 'IRAC Framework',   desc: 'Master the standard method for legal analysis: Issue, Rule, Application, and Conclusion.', category: 'ACADEMIC', featured: true },
  { slug: 'case-brief', label: 'Case Brief',        desc: 'Summarize judicial opinions, procedural history, and core legal holdings.', category: 'RESEARCH' },
  { slug: 'statute',    label: 'Statute Summary',   desc: 'Concise breakdown of legislative Acts, provisions and effective dates.', category: 'COMPLIANCE' },
  { slug: 'research',   label: 'Research Memo',     desc: 'Draft internal office memo with proper citation, legal questions, and actionable findings.', category: 'INTERNAL' },
  { slug: 'lecture',    label: 'Lecture Notes',     desc: 'Streamlined layout for law school lectures or legal seminar tracking.', category: 'EDUCATION' },
] as const;

type TemplateSlug = typeof STATIC_TEMPLATES[number]['slug'];

const TEMPLATE_CONTENT: Record<TemplateSlug, string> = {
  blank: '',
  irac: '## Issue\n\n\n## Rule\n\n\n## Application\n\n\n## Conclusion\n',
  'case-brief': '## Case Name & Citation\n\n\n## Facts\n\n\n## Procedural History\n\n\n## Issue\n\n\n## Holding\n\n\n## Reasoning\n\n\n## Significance\n',
  statute: '## Statute Name\n\n\n## Jurisdiction & Date\n\n\n## Key Provisions\n\n\n## Definitions\n\n\n## Application\n',
  research: '## Legal Question\n\n\n## Summary of Findings\n\n\n## Relevant Cases\n\n\n## Applicable Statutes\n\n\n## Conclusion & Recommendation\n',
  lecture: '## Lecture Topic\n\n\n## Key Concepts\n\n\n## Case References\n\n\n## Notes\n',
};

const SUBJECT_TABS = ['All Notes', 'Contract law', 'Criminal law', 'Tort law'] as const;
type SubjectTab = typeof SUBJECT_TABS[number];

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotesPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [view, setView] = useState<'gallery' | 'saved'>('gallery');
  const [notes, setNotes] = useState<Note[]>([]);
  const [apiTemplates, setApiTemplates] = useState<NoteTemplate[]>([]);
  const [search, setSearch] = useState('');
  const [subjectTab, setSubjectTab] = useState<SubjectTab>('All Notes');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const loadNotes = useCallback(async (t: string, q: string, subject?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: 30 };
      if (q) params.search = q;
      if (subject && subject !== 'All Notes') params.subject = subject;
      const res = await getNotes(t, params as Parameters<typeof getNotes>[1]);
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
    void getNoteTemplates(t).then((r) => setApiTemplates(r.data ?? [])).catch(() => {});
  }, [router]);

  useEffect(() => {
    if (!token || view !== 'saved') return;
    const timer = setTimeout(() => void loadNotes(token, search, subjectTab), 300);
    return () => clearTimeout(timer);
  }, [search, subjectTab, token, view, loadNotes]);

  function handleViewSaved() {
    setView('saved');
    if (token) void loadNotes(token, '', 'All Notes');
  }

  async function handleCreateFromSlug(slug: TemplateSlug) {
    if (!token || creating) return;
    setCreating(true);
    setError('');
    try {
      // Try to match an API template by slug/name, otherwise create blank
      const apiMatch = apiTemplates.find((t) =>
        t.name.toLowerCase().includes(slug.replace('-', ' ')) || t.category?.toLowerCase() === slug
      );
      const staticTpl = STATIC_TEMPLATES.find((t) => t.slug === slug);
      const payload = apiMatch
        ? { title: apiMatch.name, content: apiMatch.content }
        : { title: staticTpl?.label ?? 'Untitled Note', content: TEMPLATE_CONTENT[slug] };
      const res = await createNote(payload, token);
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

  // ── Gallery view ──────────────────────────────────────────────────────────
  if (view === 'gallery') {
    return (
      <div className={styles.page}>
        <header className={styles.galleryBar}>
          <div>
            <h1 className={styles.galleryTitle}>Create New Legal Note</h1>
            <p className={styles.gallerySub}>Select a specialised template to structure your research or start with a blank canvas for custom drafting.</p>
          </div>
          <button className={styles.savedNotesBtn} onClick={handleViewSaved}>
            Saved Notes
          </button>
        </header>

        <div className={styles.galleryContent}>
          {error && <p className={styles.error} role="alert">{error}</p>}

          {/* Recommended section */}
          <section>
            <p className={styles.sectionLabel}>RECOMMENDED FOR YOU</p>
            <div className={styles.recommendedRow}>
              {/* Blank Note */}
              <button className={styles.blankCard} onClick={() => handleCreateFromSlug('blank')} disabled={creating}>
                <div className={styles.blankIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                    <path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </div>
                <span className={styles.blankLabel}>Blank Note</span>
                <span className={styles.blankDesc}>Start from a clean slate for custom research or unique drafting requirements.</span>
                <span className={styles.selectFree}>Select free-form</span>
              </button>

              {/* IRAC featured */}
              <div className={styles.featuredCard}>
                <div className={styles.featuredImg} aria-hidden="true" />
                <div className={styles.featuredBody}>
                  <div className={styles.featuredTags}>
                    <span className={styles.featuredTag}>Popular</span>
                    <span className={styles.featuredTag}>Academic</span>
                  </div>
                  <h3 className={styles.featuredTitle}>IRAC Framework</h3>
                  <p className={styles.featuredDesc}>Master the standard method for legal analysis: Issue, Rule, Application, and Conclusion. Perfect for law school and legal practice.</p>
                  <button className={styles.useTemplateBtn} onClick={() => handleCreateFromSlug('irac')} disabled={creating}>
                    Use Template
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Professional templates */}
          <section>
            <p className={styles.sectionLabel}>PROFESSIONAL TEMPLATES</p>
            <div className={styles.proGrid}>
              {STATIC_TEMPLATES.filter((t) => !['blank', 'irac'].includes(t.slug)).map((tpl) => (
                <button
                  key={tpl.slug}
                  className={styles.proCard}
                  onClick={() => handleCreateFromSlug(tpl.slug as TemplateSlug)}
                  disabled={creating}
                >
                  <div className={styles.proIcon}>
                    <TemplateIcon slug={tpl.slug as TemplateSlug} />
                  </div>
                  <h3 className={styles.proTitle}>{tpl.label}</h3>
                  <p className={styles.proDesc}>{tpl.desc}</p>
                  <div className={styles.proFooter}>
                    <span className={styles.proCategory}>{tpl.category}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  // ── Saved notes view ──────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <header className={styles.savedBar}>
        <div className={styles.savedSearch}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={styles.searchIcon}>
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8" />
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            className={styles.searchInput}
            placeholder="Search Notes"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search notes"
          />
        </div>
        <button className={styles.newNoteBtn} onClick={() => setView('gallery')}>
          + New Note
        </button>
      </header>

      <div className={styles.savedContent}>
        {/* Subject tabs + pagination */}
        <div className={styles.savedHeader}>
          <div className={styles.subjectTabs}>
            {SUBJECT_TABS.map((tab) => (
              <button
                key={tab}
                className={`${styles.subjectTab} ${subjectTab === tab ? styles.subjectTabActive : ''}`}
                onClick={() => setSubjectTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className={styles.paginationRow}>
            <button className={styles.pageArrow} aria-label="Previous page">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button className={styles.pageArrow} aria-label="Next page">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}

        {loading ? (
          <p className={styles.stateMsg}>Loading…</p>
        ) : notes.length === 0 ? (
          <div className={styles.emptyBox}>
            <p>No notes found. <button className={styles.inlineLink} onClick={() => setView('gallery')}>Create your first note.</button></p>
          </div>
        ) : (
          <>
            <div className={styles.noteGrid}>
              {notes.map((note) => (
                <NoteCard key={note.id} note={note} onDelete={handleDelete} />
              ))}
            </div>
            <p className={styles.syncMsg}>
              Last synced: Today at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Note card ────────────────────────────────────────────────────────────────

function NoteCard({ note, onDelete }: { note: Note; onDelete: (id: string) => void }) {
  const score = note.qualityScore ?? 0;
  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={styles.noteCard}>
      <div className={styles.noteCardTopRow}>
        {note.subject && <span className={styles.noteSubjectBadge}>{note.subject}</span>}
        <div className={styles.scoreWrap}>
          <div className={styles.scoreCircle} title={`${score}% AI score`}>
            <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
              <circle cx="22" cy="22" r="18" fill="none" stroke="#F3F4F6" strokeWidth="4" />
              <circle cx="22" cy="22" r="18" fill="none" stroke="#D97706" strokeWidth="4"
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
      </div>
      <Link href={`/dashboard/notes/${note.id}`} className={styles.noteLink}>
        <h3 className={styles.noteTitle}>{note.title}</h3>
        {note.content && (
          <p className={styles.noteExcerpt}>{note.content.replace(/<[^>]+>/g, '').slice(0, 120)}…</p>
        )}
        <p className={styles.noteDate}>{timeAgo(note.createdAt)}</p>
      </Link>
      <button className={styles.deleteNoteBtn} onClick={() => onDelete(note.id)} aria-label="Delete note">✕</button>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

// ─── Template icons ───────────────────────────────────────────────────────────

function TemplateIcon({ slug }: { slug: TemplateSlug }) {
  if (slug === 'case-brief') return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="7" width="20" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
  if (slug === 'statute') return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
  if (slug === 'research') return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 3v6h6M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
  if (slug === 'lecture') return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
  return null;
}
