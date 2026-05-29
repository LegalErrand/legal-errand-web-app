'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './TemplateForm.module.scss';

interface Props {
  title: string;
  content: string;
  onSave: (t: string, c: string) => void;
  pendingInsert?: string;
  onInsertApplied?: () => void;
}

function get(content: string, h: string): string {
  return content.match(new RegExp(`## ${h}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`))?.[1]?.trim() ?? '';
}

export default function ResearchMemoForm({
  title,
  content,
  onSave,
  pendingInsert,
  onInsertApplied,
}: Props) {
  const [nt, setNt] = useState(title);
  const [question, setQuestion] = useState(() => get(content, 'Legal Question'));
  const [preparedBy, setPreparedBy] = useState('');
  const [date, setDate] = useState(() =>
    new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  );
  const [subjectArea, setSubjectArea] = useState('');
  const [sources, setSources] = useState(() => {
    const r = get(content, 'Relevant Cases').split('\n').filter(Boolean);
    return r.length ? r : ['', ''];
  });
  const [findings, setFindings] = useState(() => get(content, 'Summary of Findings'));
  const [gaps, setGaps] = useState(
    () => get(content, 'Conclusion & Recommendation').split('\n')[0] ?? ''
  );
  const [recommendation, setRecommendation] = useState(() =>
    get(content, 'Conclusion & Recommendation').split('\n').slice(1).join('\n').trim()
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    (
      t: string,
      q: string,
      pb: string,
      dt: string,
      sa: string,
      so: string[],
      fi: string,
      ga: string,
      re: string
    ) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        onSave(
          t,
          `## Legal Question\n${q}\n\n## Summary of Findings\n${fi}\n\n## Relevant Cases\n${so.filter(Boolean).join('\n')}\n\n## Applicable Statutes\n${pb} | ${dt} | ${sa}\n\n## Conclusion & Recommendation\n${ga}\n${re}`
        );
      }, 1200);
    },
    [onSave]
  );

  useEffect(() => {
    if (!pendingInsert) return;
    setFindings((p) => {
      const n = p + (p ? '\n\n' : '') + pendingInsert;
      save(nt, question, preparedBy, date, subjectArea, sources, n, gaps, recommendation);
      return n;
    });
    onInsertApplied?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingInsert]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const M = [
    {
      label: 'RESEARCH QUESTION',
      value: question,
      set: (v: string) => {
        setQuestion(v);
        save(nt, v, preparedBy, date, subjectArea, sources, findings, gaps, recommendation);
      },
      placeholder: 'State your research question',
    },
    {
      label: 'PREPARED BY',
      value: preparedBy,
      set: (v: string) => {
        setPreparedBy(v);
        save(nt, question, v, date, subjectArea, sources, findings, gaps, recommendation);
      },
      placeholder: 'Your name — Your level',
    },
    {
      label: 'DATE',
      value: date,
      set: (v: string) => {
        setDate(v);
        save(nt, question, preparedBy, v, subjectArea, sources, findings, gaps, recommendation);
      },
      placeholder: 'E.g 12 May 2026',
    },
    {
      label: 'SUBJECT AREA',
      value: subjectArea,
      set: (v: string) => {
        setSubjectArea(v);
        save(nt, question, preparedBy, date, v, sources, findings, gaps, recommendation);
      },
      placeholder: 'E.g Tort law',
    },
  ];

  return (
    <div className={styles.form}>
      <input
        className={styles.titleInput}
        value={nt}
        onChange={(e) => {
          setNt(e.target.value);
          save(
            e.target.value,
            question,
            preparedBy,
            date,
            subjectArea,
            sources,
            findings,
            gaps,
            recommendation
          );
        }}
        placeholder="Untitled research memo — state your research question as title."
      />
      <div className={styles.metaGrid}>
        {M.map(({ label, value, set, placeholder }) => (
          <div key={label} className={styles.metaField}>
            <span className={styles.metaLabel}>{label}</span>
            <input
              className={styles.metaInput}
              value={value}
              onChange={(e) => set(e.target.value)}
              placeholder={placeholder}
            />
          </div>
        ))}
      </div>
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionLabel}>SOURCES & AUTHORITIES</span>
          <span className={styles.sectionLine} />
        </div>
        {sources.map((v, i) => (
          <div key={i} className={styles.listItem}>
            <input
              className={styles.listInput}
              value={v}
              onChange={(e) => {
                const n = sources.map((x, j) => (j === i ? e.target.value : x));
                setSources(n);
                save(
                  nt,
                  question,
                  preparedBy,
                  date,
                  subjectArea,
                  n,
                  findings,
                  gaps,
                  recommendation
                );
              }}
              placeholder={
                i === 0
                  ? 'Add first source — cases, statutes or text...'
                  : `Add ${i === 1 ? 'a second' : 'another'} source`
              }
            />
            <button
              className={styles.removeBtn}
              type="button"
              onClick={() => {
                const n = sources.filter((_, j) => j !== i);
                setSources(n);
                save(
                  nt,
                  question,
                  preparedBy,
                  date,
                  subjectArea,
                  n,
                  findings,
                  gaps,
                  recommendation
                );
              }}
            >
              ×
            </button>
          </div>
        ))}
        <button
          className={styles.addBtn}
          type="button"
          onClick={() => setSources((p) => [...p, ''])}
        >
          + Add Source
        </button>
      </div>
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionLabel}>KEY FINDINGS</span>
          <span className={styles.sectionLine} />
        </div>
        <textarea
          className={styles.sectionTextarea}
          value={findings}
          onChange={(e) => {
            setFindings(e.target.value);
            save(
              nt,
              question,
              preparedBy,
              date,
              subjectArea,
              sources,
              e.target.value,
              gaps,
              recommendation
            );
          }}
          placeholder="Finding title: Summarize what you found on this point and cite the authority that supports it..."
        />
      </div>
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionLabel}>RESEARCH GAPS</span>
          <span className={styles.sectionLine} />
        </div>
        <textarea
          className={styles.sectionTextarea}
          value={gaps}
          onChange={(e) => {
            setGaps(e.target.value);
            save(
              nt,
              question,
              preparedBy,
              date,
              subjectArea,
              sources,
              findings,
              e.target.value,
              recommendation
            );
          }}
          placeholder="What are the unanswered questions, unexplored areas, or contradiction in this research that require additional exploration?"
        />
      </div>
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionLabel}>RESEARCH RECOMMENDATION</span>
          <span className={styles.sectionLine} />
        </div>
        <textarea
          className={styles.sectionTextarea}
          value={recommendation}
          onChange={(e) => {
            setRecommendation(e.target.value);
            save(
              nt,
              question,
              preparedBy,
              date,
              subjectArea,
              sources,
              findings,
              gaps,
              e.target.value
            );
          }}
          placeholder="Write your overall recommendation or conclusion here — what does the research tell?"
        />
      </div>
    </div>
  );
}
