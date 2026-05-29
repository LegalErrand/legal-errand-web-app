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

export default function StatuteForm({
  title,
  content,
  onSave,
  pendingInsert,
  onInsertApplied,
}: Props) {
  const [nt, setNt] = useState(title);
  const [statTitle, setStatTitle] = useState(() => get(content, 'Statute Name'));
  const [capRef, setCapRef] = useState(
    () => get(content, 'Jurisdiction & Date').split('\n')[0] ?? ''
  );
  const [jurisdiction, setJurisdiction] = useState(
    () => get(content, 'Jurisdiction & Date').split('\n')[1] ?? ''
  );
  const [sectionCovered, setSectionCovered] = useState(
    () => get(content, 'Key Provisions').split('\n')[0] ?? ''
  );
  const [overview, setOverview] = useState(() => get(content, 'Definitions'));
  const [provisions, setProvisions] = useState(() => {
    const r = get(content, 'Key Provisions').split('\n').filter(Boolean);
    return r.length > 1 ? r.slice(1) : [''];
  });
  const [cases, setCases] = useState(() => {
    const r = get(content, 'Application').split('\n').filter(Boolean);
    return r.length ? r : [''];
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    (
      t: string,
      st: string,
      cr: string,
      j: string,
      sc: string,
      ov: string,
      pr: string[],
      ca: string[]
    ) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        onSave(
          t,
          `## Statute Name\n${st}\n\n## Jurisdiction & Date\n${cr}\n${j}\n\n## Key Provisions\n${sc}\n${pr.filter(Boolean).join('\n')}\n\n## Definitions\n${ov}\n\n## Application\n${ca.filter(Boolean).join('\n')}`
        );
      }, 1200);
    },
    [onSave]
  );

  useEffect(() => {
    if (!pendingInsert) return;
    setOverview((p) => {
      const n = p + (p ? '\n\n' : '') + pendingInsert;
      save(nt, statTitle, capRef, jurisdiction, sectionCovered, n, provisions, cases);
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
      label: 'STATUTE TITLE',
      value: statTitle,
      set: (v: string) => {
        setStatTitle(v);
        save(nt, v, capRef, jurisdiction, sectionCovered, overview, provisions, cases);
      },
      placeholder: 'E.g Evidence Act 2011',
    },
    {
      label: 'CAP/REFERENCE NO',
      value: capRef,
      set: (v: string) => {
        setCapRef(v);
        save(nt, statTitle, v, jurisdiction, sectionCovered, overview, provisions, cases);
      },
      placeholder: 'E.g Cap E14 LFN 1234',
    },
    {
      label: 'JURISDICTION',
      value: jurisdiction,
      set: (v: string) => {
        setJurisdiction(v);
        save(nt, statTitle, capRef, v, sectionCovered, overview, provisions, cases);
      },
      placeholder: 'E.g Federal Republic of Nigeria',
    },
    {
      label: 'SECTION COVERED',
      value: sectionCovered,
      set: (v: string) => {
        setSectionCovered(v);
        save(nt, statTitle, capRef, jurisdiction, v, overview, provisions, cases);
      },
      placeholder: 'E.g S 83 - S 89',
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
            statTitle,
            capRef,
            jurisdiction,
            sectionCovered,
            overview,
            provisions,
            cases
          );
        }}
        placeholder="Untitled statute note — e.g Evidence Act 2011"
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
          <span className={styles.sectionLabel}>OVERVIEW</span>
          <span className={styles.sectionLine} />
        </div>
        <textarea
          className={styles.sectionTextarea}
          value={overview}
          onChange={(e) => {
            setOverview(e.target.value);
            save(
              nt,
              statTitle,
              capRef,
              jurisdiction,
              sectionCovered,
              e.target.value,
              provisions,
              cases
            );
          }}
          placeholder="Explain briefly what this statute does — its purpose, who it applies to, and which area of law it governs..."
        />
      </div>
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionLabel}>KEY PROVISION</span>
          <span className={styles.sectionLine} />
        </div>
        {provisions.map((v, i) => (
          <div key={i} className={styles.listItem}>
            <input
              className={styles.listInput}
              value={v}
              onChange={(e) => {
                const n = provisions.map((x, j) => (j === i ? e.target.value : x));
                setProvisions(n);
                save(nt, statTitle, capRef, jurisdiction, sectionCovered, overview, n, cases);
              }}
              placeholder={`Add ${i === 0 ? 'first' : i === 1 ? 'a second' : 'a'} section — Paste or type the section number and heading`}
            />
            <button
              className={styles.removeBtn}
              type="button"
              onClick={() => {
                const n = provisions.filter((_, j) => j !== i);
                setProvisions(n);
                save(nt, statTitle, capRef, jurisdiction, sectionCovered, overview, n, cases);
              }}
            >
              ×
            </button>
          </div>
        ))}
        <button
          className={styles.addBtn}
          type="button"
          onClick={() => setProvisions((p) => [...p, ''])}
        >
          + Add provision
        </button>
      </div>
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionLabel}>CASES INTERPRETING THIS STATUTE</span>
          <span className={styles.sectionLine} />
        </div>
        {cases.map((v, i) => (
          <div key={i} className={styles.listItem}>
            <input
              className={styles.listInput}
              value={v}
              onChange={(e) => {
                const n = cases.map((x, j) => (j === i ? e.target.value : x));
                setCases(n);
                save(nt, statTitle, capRef, jurisdiction, sectionCovered, overview, provisions, n);
              }}
              placeholder="Link cases interpreting this statute..."
            />
            <button
              className={styles.removeBtn}
              type="button"
              onClick={() => {
                const n = cases.filter((_, j) => j !== i);
                setCases(n);
                save(nt, statTitle, capRef, jurisdiction, sectionCovered, overview, provisions, n);
              }}
            >
              ×
            </button>
          </div>
        ))}
        <button className={styles.addBtn} type="button" onClick={() => setCases((p) => [...p, ''])}>
          + Add Case link
        </button>
      </div>
    </div>
  );
}
