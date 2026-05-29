'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './TemplateForm.module.scss';

interface Props {
  title: string; content: string; onSave: (t: string, c: string) => void;
  pendingInsert?: string; onInsertApplied?: () => void;
}

function get(content: string, h: string): string {
  return content.match(new RegExp(`## ${h}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`))?.[1]?.trim() ?? '';
}

export default function LectureNotesForm({ title, content, onSave, pendingInsert, onInsertApplied }: Props) {
  const [nt, setNt] = useState(title);
  const [courseTitle, setCourseTitle] = useState('');
  const [lecturer, setLecturer] = useState('');
  const [date, setDate] = useState(() => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
  const [topicWeek, setTopicWeek] = useState('');
  const [keyConcepts, setKeyConcepts] = useState(() => get(content, 'Key Concepts'));
  const [lectureFlow, setLectureFlow] = useState(() => get(content, 'Case References'));
  const [marginNotes, setMarginNotes] = useState(() => get(content, 'Notes'));
  const [examPointers, setExamPointers] = useState<string[]>(['']);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback((t: string, ct: string, lc: string, dt: string, tw: string, kc: string, lf: string, mn: string, ep: string[]) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onSave(t, `## Lecture Topic\n${ct} | ${lc} | ${dt} | ${tw}\n\n## Key Concepts\n${kc}\n\n## Case References\n${lf}\n\n## Notes\n${mn}\n\n## Exam Pointers\n${ep.filter(Boolean).join('\n')}`);
    }, 1200);
  }, [onSave]);

  useEffect(() => {
    if (!pendingInsert) return;
    setKeyConcepts(p => {
      const n = p + (p ? '\n\n' : '') + pendingInsert;
      save(nt, courseTitle, lecturer, date, topicWeek, n, lectureFlow, marginNotes, examPointers);
      return n;
    });
    onInsertApplied?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingInsert]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const M = [
    { label: 'COURSE TITLE / CODE', value: courseTitle, set: (v: string) => { setCourseTitle(v); save(nt, v, lecturer, date, topicWeek, keyConcepts, lectureFlow, marginNotes, examPointers); }, placeholder: 'E.g LAW 302 / tort law' },
    { label: 'LECTURER', value: lecturer, set: (v: string) => { setLecturer(v); save(nt, courseTitle, v, date, topicWeek, keyConcepts, lectureFlow, marginNotes, examPointers); }, placeholder: 'E.g Prof. Smith' },
    { label: 'DATE', value: date, set: (v: string) => { setDate(v); save(nt, courseTitle, lecturer, v, topicWeek, keyConcepts, lectureFlow, marginNotes, examPointers); }, placeholder: 'E.g 12 May 2026' },
    { label: 'TOPIC / WEEK', value: topicWeek, set: (v: string) => { setTopicWeek(v); save(nt, courseTitle, lecturer, date, v, keyConcepts, lectureFlow, marginNotes, examPointers); }, placeholder: 'E.g Tort law week 2' },
  ];

  return (
    <div className={styles.form}>
      <input className={styles.titleInput} value={nt}
        onChange={e => { setNt(e.target.value); save(e.target.value, courseTitle, lecturer, date, topicWeek, keyConcepts, lectureFlow, marginNotes, examPointers); }}
        placeholder="Untitled Lecture Note — E.g Torts law week 2" />
      <div className={styles.metaGrid}>
        {M.map(({ label, value, set, placeholder }) => (
          <div key={label} className={styles.metaField}>
            <span className={styles.metaLabel}>{label}</span>
            <input className={styles.metaInput} value={value} onChange={e => set(e.target.value)} placeholder={placeholder} />
          </div>
        ))}
      </div>
      <div className={styles.section}>
        <div className={styles.sectionHead}><span className={styles.sectionLabel}>KEY CONCEPT COVERED</span><span className={styles.sectionLine} /></div>
        <textarea className={styles.sectionTextarea} value={keyConcepts}
          onChange={e => { setKeyConcepts(e.target.value); save(nt, courseTitle, lecturer, date, topicWeek, e.target.value, lectureFlow, marginNotes, examPointers); }}
          placeholder="Add key concepts on this topic in bullet points..." />
      </div>
      <div className={styles.section}>
        <div className={styles.sectionHead}><span className={styles.sectionLabel}>LECTURE FLOW</span><span className={styles.sectionLine} /></div>
        <textarea className={`${styles.sectionTextarea} ${styles.sectionTextareaLg}`} value={lectureFlow}
          onChange={e => { setLectureFlow(e.target.value); save(nt, courseTitle, lecturer, date, topicWeek, keyConcepts, e.target.value, marginNotes, examPointers); }}
          placeholder="Write a clear, logical structure of this topic in this section..." />
      </div>
      <div className={styles.section}>
        <div className={styles.sectionHead}><span className={styles.sectionLabel}>MARGIN NOTES</span><span className={styles.sectionLine} /></div>
        <textarea className={styles.sectionTextarea} value={marginNotes}
          onChange={e => { setMarginNotes(e.target.value); save(nt, courseTitle, lecturer, date, topicWeek, keyConcepts, lectureFlow, e.target.value, examPointers); }}
          placeholder="Your personal notes — your questions you want to ask, things to follow up, connection to other topics..." />
      </div>
      <div className={styles.section}>
        <div className={styles.sectionHead}><span className={styles.sectionLabel}>EXAM POINTERS</span><span className={styles.sectionLine} /></div>
        {examPointers.map((v, i) => (
          <div key={i} className={styles.listItem}>
            <input className={styles.listInput} value={v}
              onChange={e => { const n = examPointers.map((x, j) => j === i ? e.target.value : x); setExamPointers(n); save(nt, courseTitle, lecturer, date, topicWeek, keyConcepts, lectureFlow, marginNotes, n); }}
              placeholder="Type / Click to add exam relevant points flagged in this topic..." />
            <button className={styles.removeBtn} type="button"
              onClick={() => { const n = examPointers.filter((_, j) => j !== i); setExamPointers(n); save(nt, courseTitle, lecturer, date, topicWeek, keyConcepts, lectureFlow, marginNotes, n); }}>×</button>
          </div>
        ))}
        <button className={styles.addBtn} type="button" onClick={() => setExamPointers(p => [...p, ''])}>+ Add pointer</button>
      </div>
    </div>
  );
}
