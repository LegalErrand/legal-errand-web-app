'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  searchResearch,
  getResearchSessions,
  deleteResearchSession,
  getFetchErrorMessage,
  getAccessToken,
} from '@/lib';
import type { ResearchResult, ResearchSession } from '@/lib';
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
    if (!t) {
      router.replace('/login');
      return;
    }
    setToken(t);
    void loadSessions(t);
  }, [router]);

  async function loadSessions(t: string) {
    setSessionsLoading(true);
    try {
      const res = await getResearchSessions(t, { limit: 20 });
      setSessions(res.data?.data ?? []);
    } catch {
      /* silent */
    } finally {
      setSessionsLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !query.trim()) return;
    setSearching(true);
    setSearchErr('');
    setResults([]);
    setRefinedQuery('');
    try {
      const payload = jurisdiction
        ? { query: query.trim(), jurisdiction }
        : { query: query.trim() };
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
    } catch {
      /* silent */
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <h1 className={styles.pageHeading}>Legal Research</h1>
        <p className={styles.pageSub}>
          Explore the entire corpus of Nigerian law using natural language.
        </p>

        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.queryRow}>
            <input
              className={styles.queryInput}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What are the defense to negligence under Nigerian tort law?"
            />
            <button
              type="submit"
              className={styles.searchBtn}
              disabled={searching || !query.trim()}
            >
              {searching ? 'Searching…' : 'Search'}
            </button>
          </div>
          {searchErr && (
            <p className={styles.searchErr} role="alert">
              {searchErr}
            </p>
          )}
        </form>

        {(results.length > 0 || refinedQuery) && (
          <>
            {refinedQuery && (
              <p className={styles.refinedQuery}>
                Showing results for: <em>&quot;{refinedQuery}&quot;</em>
              </p>
            )}
            <div className={styles.mainSplit}>
              <div className={styles.resultsCol}>
                {results.map((r) => (
                  <div key={r.documentId} className={styles.resultCard}>
                    <div className={styles.resultHeader}>
                      <Link
                        href={`/dashboard/library/${r.documentId}`}
                        className={styles.resultTitle}
                      >
                        {r.title}
                      </Link>
                      <span className={styles.matchScore}>
                        {Math.round(r.matchScore * 100)}% Match
                      </span>
                    </div>
                    {r.courtLevel && <span className={styles.courtBadge}>{r.courtLevel}</span>}
                    <div className={styles.matchBarWrap}>
                      <div
                        className={styles.matchBar}
                        style={{ ['--bar-pct' as string]: `${Math.round(r.matchScore * 100)}%` }}
                      />
                    </div>
                    {r.citation && <p className={styles.resultCitation}>{r.citation}</p>}
                    {r.excerpt && <p className={styles.resultExcerpt}>{r.excerpt}</p>}
                    <div className={styles.resultTags}>
                      {r.subject && <span className={styles.tag}>{r.subject}</span>}
                      {r.type && <span className={styles.tag}>{r.type}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Filter panel */}
              <div className={styles.filterPanel}>
                <div className={styles.filterHeader}>
                  <h3 className={styles.filterHeading}>Filters</h3>
                  <button
                    className={styles.filterReset}
                    onClick={() => setJurisdiction('')}
                    type="button"
                  >
                    Reset
                  </button>
                </div>
                <div className={styles.filterGroup}>
                  <p className={styles.filterGroupLabel}>Jurisdiction</p>
                  {['Federal', 'State'].map((j) => (
                    <label key={j} className={styles.filterCheckRow}>
                      <input
                        type="checkbox"
                        checked={jurisdiction === j}
                        onChange={(e) => setJurisdiction(e.target.checked ? j : '')}
                      />
                      <span className={styles.filterCheckLabel}>{j}</span>
                    </label>
                  ))}
                </div>
                <div className={styles.filterGroup}>
                  <p className={styles.filterGroupLabel}>Court Level</p>
                  <label className={styles.filterCheckRow}>
                    <input type="checkbox" />
                    <span className={styles.filterCheckLabel}>Supreme court</span>
                  </label>
                  <label className={styles.filterCheckRow}>
                    <input type="checkbox" />
                    <span className={styles.filterCheckLabel}>Appeal Court</span>
                  </label>
                  <label className={styles.filterCheckRow}>
                    <input type="checkbox" />
                    <span className={styles.filterCheckLabel}>High Court</span>
                  </label>
                </div>
                <div className={styles.filterGroup}>
                  <p className={styles.filterGroupLabel}>Subject Area</p>
                  <div className={styles.filterTagRow}>
                    <button type="button" className={styles.filterTag}>
                      Tort law
                    </button>
                    <button type="button" className={styles.filterTag}>
                      Cases
                    </button>
                    <button type="button" className={styles.filterTag}>
                      Statute
                    </button>
                    <button type="button" className={styles.filterTag}>
                      Principles
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
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
                    <p className={styles.sessionMeta}>
                      {s.results.length} results · {new Date(s.createdAt).toLocaleDateString()}
                    </p>
                  </Link>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDeleteSession(s.id)}
                    aria-label="Delete"
                    title="Delete"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
