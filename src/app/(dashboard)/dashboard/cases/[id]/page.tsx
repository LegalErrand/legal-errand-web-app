'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getCaseExplanation, saveCaseToNotes, getFetchErrorMessage } from '@/lib/api';
import { getAccessToken } from '@/lib/authStorage';
import type { CaseExplanation } from '@/lib/types';
import styles from './page.module.scss';

export default function CaseDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [caseData, setCaseData] = useState<CaseExplanation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { router.replace('/login'); return; }
    if (!id) return;

    void (async () => {
      try {
        const res = await getCaseExplanation(id, token);
        if (res.data) setCaseData(res.data);
        else setError(res.message ?? 'Case not found');
      } catch (err) {
        setError(getFetchErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [router, id]);

  async function handleSaveToNotes() {
    const token = getAccessToken();
    if (!token || !id) return;
    setSaving(true);
    try {
      await saveCaseToNotes(id, token);
      setSaved(true);
    } catch (err) {
      setError(getFetchErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className={styles.page}><p className={styles.state}>Loading case…</p></div>;
  if (error) return <div className={styles.page}><p className={styles.stateError}>{error}</p></div>;
  if (!caseData) return <div className={styles.page}><p className={styles.state}>Case not found.</p></div>;

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <Link href="/dashboard/cases" className={styles.backBtn}>← Cases</Link>
        <div className={styles.headerActions}>
          {!saved ? (
            <button className={styles.saveBtn} onClick={handleSaveToNotes} disabled={saving}>
              {saving ? 'Saving…' : 'Save to Notes'}
            </button>
          ) : (
            <span className={styles.savedBadge}>✓ Saved to Notes</span>
          )}
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.caseHeader}>
          <h1 className={styles.citation}>{caseData.citation ?? 'Case Analysis'}</h1>
          {caseData.status && (
            <span className={`${styles.status} ${styles[`status_${caseData.status}`]}`}>{caseData.status}</span>
          )}
        </div>

        {caseData.status === 'pending' || caseData.status === 'processing' ? (
          <div className={styles.processingCard}>
            <p>The case is being analysed. Please check back in a moment.</p>
          </div>
        ) : (
          <>
            {caseData.facts && <Section title="Facts" body={caseData.facts} />}
            {caseData.issue && <Section title="Issue" body={caseData.issue} />}
            {caseData.holding && <Section title="Holding" body={caseData.holding} />}
            {caseData.reasoning && <Section title="Reasoning" body={caseData.reasoning} />}
            {caseData.significance && <Section title="Significance" body={caseData.significance} />}

            {caseData.relatedCases && caseData.relatedCases.length > 0 && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Related Cases</h2>
                <ul className={styles.relatedList}>
                  {caseData.relatedCases.map((rc) => (
                    <li key={rc.citation} className={styles.relatedItem}>
                      <span className={styles.relatedCitation}>{rc.citation}</span>
                      {rc.description && <p className={styles.relatedDesc}>{rc.description}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {caseData.practiceQuestions && caseData.practiceQuestions.length > 0 && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Practice Questions</h2>
                <ol className={styles.questionList}>
                  {caseData.practiceQuestions.map((q, i) => (
                    <li key={i} className={styles.questionItem}>{q}</li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>{title}</h2>
      <p className={styles.cardBody}>{body}</p>
    </div>
  );
}
