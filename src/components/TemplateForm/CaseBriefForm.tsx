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

export default function CaseBriefForm({
  title,
  content,
  onSave,
  pendingInsert,
  onInsertApplied,
}: Props) {
  const [nt, setNt] = useState(title);
  const [citation, setCitation] = useState(() => get(content, 'Case Name & Citation'));
  const [facts, setFacts] = useState(() => get(content, 'Facts'));
  const [issues, setIssues] = useState(() => get(content, 'Issues'));
  const [holding, setHolding] = useState(() => get(content, 'Holding'));
  const [reasoning, setReasoning] = useState(() => get(content, 'Reasoning'));
  const [significance, setSignificance] = useState(() => get(content, 'Significance'));
  const [links, setLinks] = useState(() => {
    const r = get(content, 'Related Cases').split('\n').filter(Boolean);
    return r.length ? r : ['', ''];
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    (
      t: string,
      ci: string,
      f: string,
      is: string,
      h: string,
      re: string,
      si: string,
      li: string[]
    ) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const body = `## Case Name & Citation\n${ci}\n\n## Facts\n${f}\n\n## Issues\n${is}\n\n## Holding\n${h}\n\n## Reasoning\n${re}\n\n## Significance\n${si}\n\n## Related Cases\n${li.filter(Boolean).join('\n')}`;
        onSave(t, body);
      }, 1200);
    },
    [onSave]
  );

  useEffect(() => {
    if (!pendingInsert) return;
    setFacts((p) => {
      const n = p + (p ? '\n\n' : '') + pendingInsert;
      save(nt, citation, n, issues, holding, reasoning, significance, links);
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

  const S = [
    {
      n: '01',
      l: 'FACTS',
      v: facts,
      set: (v: string) => {
        setFacts(v);
        save(nt, citation, v, issues, holding, reasoning, significance, links);
      },
      p: 'Summarize the key facts — who the parties are, what happened and what sequence of events led to the dispute...',
    },
    {
      n: '02',
      l: 'ISSUES',
      v: issues,
      set: (v: string) => {
        setIssues(v);
        save(nt, citation, facts, v, holding, reasoning, significance, links);
      },
      p: 'State the central legal question the court had to answer. Frame it as a question.',
    },
    {
      n: '03',
      l: 'HOLDING',
      v: holding,
      set: (v: string) => {
        setHolding(v);
        save(nt, citation, facts, issues, v, reasoning, significance, links);
      },
      p: "State the court's decision. Include the rule it announced e.g if A then B.",
    },
    {
      n: '04',
      l: 'REASONING',
      v: reasoning,
      set: (v: string) => {
        setReasoning(v);
        save(nt, citation, facts, issues, holding, v, significance, links);
      },
      p: "Explain the court's rationale — what legal principles, precedents, or statutes did the court rely on?",
    },
    {
      n: '05',
      l: 'SIGNIFICANCE',
      v: significance,
      set: (v: string) => {
        setSignificance(v);
        save(nt, citation, facts, issues, holding, reasoning, v, links);
      },
      p: 'Why does this case matter? What principles does it establish (obiter, ratio decidendi)?',
    },
  ];

  return (
    <div className={styles.form}>
      <input
        className={styles.titleInput}
        value={nt}
        onChange={(e) => {
          setNt(e.target.value);
          save(e.target.value, citation, facts, issues, holding, reasoning, significance, links);
        }}
        placeholder="Untitled case note — e.g Abacha v. Fawehinmi [2000]..."
      />
      <input
        className={`${styles.metaInput} ${styles.citationInput}`}
        value={citation}
        onChange={(e) => {
          setCitation(e.target.value);
          save(nt, e.target.value, facts, issues, holding, reasoning, significance, links);
        }}
        placeholder="Citation — e.g [2000] 6 NWLR (Pt. 660) 228; [2000] LPELR-14SC"
      />
      {S.map(({ n, l, v, set, p }) => (
        <div key={l} className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionNumber}>{n}.</span>
            <span className={styles.sectionLabel}>{l}</span>
            <span className={styles.sectionLine} />
          </div>
          <textarea
            className={styles.sectionTextarea}
            value={v}
            onChange={(e) => set(e.target.value)}
            placeholder={p}
          />
        </div>
      ))}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionNumber}>06.</span>
          <span className={styles.sectionLabel}>RELATED CASES</span>
          <span className={styles.sectionLine} />
        </div>
        {links.map((v, i) => (
          <div key={i} className={styles.listItem}>
            <input
              className={styles.listInput}
              value={v}
              onChange={(e) => {
                const n = links.map((x, j) => (j === i ? e.target.value : x));
                setLinks(n);
                save(nt, citation, facts, issues, holding, reasoning, significance, n);
              }}
              placeholder="Paste link to related case here..."
            />
            <button
              className={styles.removeBtn}
              type="button"
              onClick={() => {
                const n = links.filter((_, j) => j !== i);
                setLinks(n);
                save(nt, citation, facts, issues, holding, reasoning, significance, n);
              }}
            >
              ×
            </button>
          </div>
        ))}
        <button className={styles.addBtn} type="button" onClick={() => setLinks((p) => [...p, ''])}>
          + Add link
        </button>
      </div>
    </div>
  );
}
