'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { searchResearch, getResearchSessions, deleteResearchSession, getFetchErrorMessage } from '@/lib/api';
import { getAccessToken } from '@/lib/authStorage';
import type { ResearchResult, ResearchSession } from '@/lib/types';
import styles from './page.module.scss';

export default function ResearchPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [query, setQuery] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [refinedQuery, setRefinedQuery] = useState('');
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState('');
  const [sessionsLoading, setSessionsLoading] = useState(true);

  useEffect(() => {
    const t = getAccessToken();
    if (!t) { router.replace('/login'); return; }
    setToken(t);
    void loadSessions(t);
  }, [router]);

  async function loadSessions(t: string) {
    setSessionsLoading(true);
    try {
      const res = await getResearchSessions(t, { limit: 20 });
      setSessions(res.data?.data ?? []);
    } catch { /* silent */ }
    finally { setSessionsLoading(false); }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !query.trim()) return;
    setSearching(true);
    setSearchErr('');
    setResults([]);
    setRefinedQuery('');
    try {
      const payload = jurisdiction ? { query: query.trim(), jurisdiction } : { query: query.trim() };
      const res = await searchResearch(payload, token);
      if (res.data) {
        setResults(res.data.results);
        setRefinedQuery(res.data.refinedQuery);
        void loadSessions(token);
      } else {
        setSearchErr(res.message ?? 'Search failed');
      }
    } catch (err) {
      setSearchErr(getFetchErrorMessage(err));
    } finally {
      setSearching(false);
    }
  }

  async function handleDeleteSession(id: string) {
    if (!token || !confirm('Delete this research session?')) return;
    try {
      await deleteResearchSession(id, token);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch { /* silent */ }
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <h1 className={styles.pageTitle}>Legal Research</h1>
      </header>

      <div className={styles.content}>
        <section className={styles.searchCard}>
          <h2 className={styles.sectionTitle}>Search Legal Sources</h2>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.queryRow}>
              <input
                className={styles.queryInput}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Admissibility of electronic evidence under Nigerian law"
              />
              <button type="submit" className={styles.searchBtn} disabled={searching || !query.trim()}>
                {searching ? 'Searching…' : 'Search'}
              </button>
            </div>
            <input
              className={styles.jurisdictionInput}
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              placeholder="Jurisdiction (optional, e.g. Nigeria)"
            />
            {searchErr && <p className={styles.searchErr} role="alert">{searchErr}</p>}
          </form>
        </section>

        {(results.length > 0 || refinedQuery) && (
          <section>
            {refinedQuery && (
              <p className={styles.refinedQuery}>Refined query: <em>{refinedQuery}</em></p>
            )}
            <div className={styles.resultsList}>
              {results.map((r) => (
                <div key={r.documentId} className={styles.resultCard}>
                  <div className={styles.resultHeader}>
                    <Link href={`/dashboard/library/${r.documentId}`} className={styles.resultTitle}>{r.title}</Link>
                    <span className={styles.matchScore}>{Math.round(r.matchScore * 100)}% match</span>
                  </div>
                  {r.citation && <p className={styles.resultCitation}>{r.citation}</p>}
                  {r.excerpt && <p className={styles.resultExcerpt}>{r.excerpt}</p>}
                  <div className={styles.resultTags}>
                    {r.subject && <span className={styles.tag}>{r.subject}</span>}
                    {r.type && <span className={styles.tag}>{r.type}</span>}
                    {r.courtLevel && <span className={styles.tag}>{r.courtLevel}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className={styles.historySection}>
          <h2 className={styles.sectionTitle}>Research History</h2>
          {sessionsLoading ? (
            <p className={styles.stateMsg}>Loading…</p>
          ) : sessions.length === 0 ? (
            <p className={styles.stateMsg}>No research sessions yet.</p>
          ) : (
            <ul className={styles.sessionList}>
              {sessions.map((s) => (
                <li key={s.id} className={styles.sessionItem}>
                  <Link href={`/dashboard/research/${s.id}`} className={styles.sessionLink}>
                    <p className={styles.sessionQuery}>{s.query}</p>
                    <p className={styles.sessionMeta}>{s.results.length} results · {new Date(s.createdAt).toLocaleDateString()}</p>
                  </Link>
                  <button className={styles.deleteBtn} onClick={() => handleDeleteSession(s.id)} aria-label="Delete" title="Delete">✕</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
