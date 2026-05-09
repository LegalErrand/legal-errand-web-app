'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getResearchSession, getFetchErrorMessage } from '@/lib/api';
import { getAccessToken } from '@/lib/authStorage';
import type { ResearchSession } from '@/lib/types';
import styles from './page.module.scss';

export default function ResearchSessionPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<ResearchSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { router.replace('/login'); return; }
    if (!id) return;
    void (async () => {
      try {
        const res = await getResearchSession(id, token);
        if (res.data) setSession(res.data);
        else setError(res.message ?? 'Session not found');
      } catch (err) {
        setError(getFetchErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [router, id]);

  if (loading) return <div className={styles.page}><p className={styles.state}>Loading session…</p></div>;
  if (error) return <div className={styles.page}><p className={styles.stateError}>{error}</p></div>;
  if (!session) return <div className={styles.page}><p className={styles.state}>Session not found.</p></div>;

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <Link href="/dashboard/research" className={styles.backBtn}>← Research</Link>
      </header>

      <div className={styles.content}>
        <div className={styles.sessionHead}>
          <h1 className={styles.queryTitle}>{session.query}</h1>
          {session.refinedQuery && session.refinedQuery !== session.query && (
            <p className={styles.refined}>Refined: <em>{session.refinedQuery}</em></p>
          )}
          <p className={styles.sessionDate}>{new Date(session.createdAt).toLocaleDateString()}</p>
        </div>

        {session.memo && (
          <div className={styles.memoCard}>
            <h2 className={styles.cardTitle}>Research Memo</h2>
            <p className={styles.memoBody}>{session.memo}</p>
          </div>
        )}

        <h2 className={styles.resultsHeading}>Results ({session.results.length})</h2>
        {session.results.length === 0 ? (
          <p className={styles.state}>No results for this session.</p>
        ) : (
          <div className={styles.resultsList}>
            {session.results.map((r) => (
              <div key={r.documentId} className={styles.resultCard}>
                <div className={styles.resultHeader}>
                  <Link href={`/dashboard/library/${r.documentId}`} className={styles.resultTitle}>{r.title}</Link>
                  <span className={styles.matchScore}>{Math.round(r.matchScore * 100)}% match</span>
                </div>
                {r.citation && <p className={styles.citation}>{r.citation}</p>}
                {r.excerpt && <p className={styles.excerpt}>{r.excerpt}</p>}
                <div className={styles.tags}>
                  {r.subject && <span className={styles.tag}>{r.subject}</span>}
                  {r.type && <span className={styles.tag}>{r.type}</span>}
                  {r.courtLevel && <span className={styles.tag}>{r.courtLevel}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
