'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import tfStyles from './TemplateForm.module.scss';
import iStyles from './IracForm.module.scss';
const styles = { ...tfStyles, ...iStyles };

interface Props {
  title: string;
  content: string;
  onSave: (t: string, c: string) => void;
  pendingInsert?: string;
  onInsertApplied?: () => void;
}

type Tab = 'ISSUE' | 'RULE' | 'APPLICATION' | 'CONCLUSION';
const TABS: Tab[] = ['ISSUE', 'RULE', 'APPLICATION', 'CONCLUSION'];

function get(content: string, h: string): string {
  return content.match(new RegExp(`## ${h}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`))?.[1]?.trim() ?? '';
}

export default function IracForm({
  title,
  content,
  onSave,
  pendingInsert,
  onInsertApplied,
}: Props) {
  const [nt, setNt] = useState(title);
  const [tab, setTab] = useState<Tab>('ISSUE');
  const [issue, setIssue] = useState(() => get(content, 'Issue'));
  const [rule, setRule] = useState(() => get(content, 'Rule'));
  const [application, setApplication] = useState(() => get(content, 'Application'));
  const [conclusion, setConclusion] = useState(() => get(content, 'Conclusion'));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    (t: string, is: string, r: string, a: string, c: string) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        onSave(
          t,
          `## Issue\n${is}\n\n## Rule\n${r}\n\n## Application\n${a}\n\n## Conclusion\n${c}`
        );
      }, 1200);
    },
    [onSave]
  );

  useEffect(() => {
    if (!pendingInsert) return;
    const setter =
      tab === 'ISSUE'
        ? setIssue
        : tab === 'RULE'
          ? setRule
          : tab === 'APPLICATION'
            ? setApplication
            : setConclusion;
    setter((p) => {
      const n = p + (p ? '\n\n' : '') + pendingInsert;
      save(
        nt,
        tab === 'ISSUE' ? n : issue,
        tab === 'RULE' ? n : rule,
        tab === 'APPLICATION' ? n : application,
        tab === 'CONCLUSION' ? n : conclusion
      );
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

  const fields: Record<
    Tab,
    { value: string; set: (v: string) => void; placeholder: string; num: string }
  > = {
    ISSUE: {
      value: issue,
      set: (v) => {
        setIssue(v);
        save(nt, v, rule, application, conclusion);
      },
      placeholder:
        'State the legal issues as a question, also add a secondary issue if the problem raises more than one legal question...',
      num: '01',
    },
    RULE: {
      value: rule,
      set: (v) => {
        setRule(v);
        save(nt, issue, v, application, conclusion);
      },
      placeholder:
        'State the legal rule that applies to this issue, quote from the key case or statutes. Be precise.',
      num: '02',
    },
    APPLICATION: {
      value: application,
      set: (v) => {
        setApplication(v);
        save(nt, issue, rule, v, conclusion);
      },
      placeholder:
        'Apply the rule of law to the facts in favor of one party, and also apply the rule against — What would the opposing party argue?',
      num: '03',
    },
    CONCLUSION: {
      value: conclusion,
      set: (v) => {
        setConclusion(v);
        save(nt, issue, rule, application, v);
      },
      placeholder: 'State your conclusion.',
      num: '04',
    },
  };
  const f = fields[tab];

  return (
    <div className={styles.form}>
      <input
        className={styles.titleInput}
        value={nt}
        onChange={(e) => {
          setNt(e.target.value);
          save(e.target.value, issue, rule, application, conclusion);
        }}
        placeholder="Untitled IRAC — describe the legal problem you are analyzing..."
      />
      <div className={styles.iracTabs}>
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`${styles.iracTab} ${tab === t ? styles.iracTabActive : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionNumber}>{f.num}.</span>
          <span className={styles.sectionLabel}>{tab}</span>
          <span className={styles.sectionLine} />
        </div>
        <textarea
          className={`${styles.sectionTextarea} ${styles.sectionTextareaLg}`}
          value={f.value}
          onChange={(e) => f.set(e.target.value)}
          placeholder={f.placeholder}
        />
      </div>
    </div>
  );
}
