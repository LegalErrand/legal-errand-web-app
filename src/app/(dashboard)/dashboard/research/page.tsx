'use client';

import { useEffect, useRef, useState } from 'react';
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

const COURT_LEVELS = ['Supreme court', 'Appeal Court', 'High Court'];
const SUBJECT_TAGS = ['Tort law', 'Cases', 'Statute', 'Principles'];

export default function ResearchPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [query, setQuery] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [courtLevel, setCourtLevel] = useState('');
  const [activeSubjects, setActiveSubjects] = useState<string[]>([]);
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [refinedQuery, setRefinedQuery] = useState('');
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState('');
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);

  // Tracks the last committed query so filter changes re-search with the same query
  const committedQuery = useRef('');
  const tokenRef = useRef('');

  useEffect(() => {
    const t = getAccessToken();
    if (!t) {
      router.replace('/login');
      return;
    }
    setToken(t);
    tokenRef.current = t;
    void loadSessions(t);
  }, [router]);

  // Re-run backend search whenever filters change — but only after an initial search
  useEffect(() => {
    if (!hasSearched || !committedQuery.current) return;
    void runSearch(
      tokenRef.current,
      committedQuery.current,
      jurisdiction,
      courtLevel,
      activeSubjects
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jurisdiction, courtLevel, activeSubjects]);

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

  async function runSearch(t: string, q: string, jur: string, cl: string, subjects: string[]) {
    if (!t || !q.trim()) return;
    setSearching(true);
    setSearchErr('');
    try {
      const payload = {
        query: q.trim(),
        ...(jur ? { jurisdiction: jur } : {}),
        ...(cl ? { courtLevel: cl } : {}),
        ...(subjects.length ? { subject: subjects[0] } : {}),
      };
      const res = await searchResearch(payload, t);
      if (res.data) {
        setResults(res.data.results);
        setRefinedQuery(res.data.refinedQuery);
        setHasSearched(true);
      } else {
        setSearchErr(res.message ?? 'Search failed');
      }
    } catch (err) {
      setSearchErr(getFetchErrorMessage(err));
    } finally {
      setSearching(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !query.trim()) return;
    committedQuery.current = query.trim();
    setResults([]);
    setRefinedQuery('');
    await runSearch(token, query, jurisdiction, courtLevel, activeSubjects);
    void loadSessions(token);
  }

  function toggleSubject(s: string) {
    setActiveSubjects((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  function handleReset() {
    setJurisdiction('');
    setCourtLevel('');
    setActiveSubjects([]);
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
        <h1 className={styles.pageHeading}>
          Explore the entire corpus of Nigerian law using natural language.
        </h1>

        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.searchRow}>
            <div className={styles.inputWrap}>
              <svg
                className={styles.searchIcon}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                className={styles.queryInput}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="what is the Defense to negligence under Nigerian tort law?"
              />
            </div>
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

        {hasSearched && (
          <>
            {refinedQuery && (
              <p className={styles.showingLabel}>
                Showing results for: <em>&quot;{refinedQuery}&quot;</em>
              </p>
            )}

            <div className={styles.mainSplit}>
              {/* Results */}
              <div className={styles.resultsCol}>
                {searching && <p className={styles.stateMsg}>Searching…</p>}
                {!searching && results.length === 0 && (
                  <p className={styles.emptyMsg}>
                    No results found. Try a different query or adjust filters.
                  </p>
                )}
                {results.map((r) => (
                  <div key={r.documentId} className={styles.resultItem}>
                    <div className={styles.resultTop}>
                      <Link
                        href={`/dashboard/library/${r.documentId}`}
                        className={styles.resultTitle}
                      >
                        {r.title}
                      </Link>
                      <span className={styles.matchScore}>
                        {Math.round((r.relevanceScore ?? r.matchScore ?? 0) * 100)}% Match
                      </span>
                    </div>

                    {r.courtLevel && <span className={styles.courtBadge}>{r.courtLevel}</span>}

                    <div className={styles.matchBarWrap}>
                      <div
                        className={styles.matchBar}
                        style={{
                          ['--bar-pct' as string]: `${Math.round((r.relevanceScore ?? r.matchScore ?? 0) * 100)}%`,
                        }}
                      />
                    </div>

                    {r.excerpt && <p className={styles.resultExcerpt}>{r.excerpt}</p>}
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className={styles.filterPanel}>
                <div className={styles.filterHeader}>
                  <h3 className={styles.filterHeading}>Filters</h3>
                  <button className={styles.filterReset} onClick={handleReset} type="button">
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
                  {COURT_LEVELS.map((c) => (
                    <label key={c} className={styles.filterCheckRow}>
                      <input
                        type="checkbox"
                        checked={courtLevel === c}
                        onChange={(e) => setCourtLevel(e.target.checked ? c : '')}
                      />
                      <span className={styles.filterCheckLabel}>{c}</span>
                    </label>
                  ))}
                </div>

                <div className={styles.filterGroup}>
                  <p className={styles.filterGroupLabel}>Subject Area</p>
                  <div className={styles.filterTagRow}>
                    {SUBJECT_TAGS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`${styles.filterTag} ${activeSubjects.includes(s) ? styles.filterTagActive : ''}`}
                        onClick={() => toggleSubject(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Research History — shown only before first search */}
        {!hasSearched && (
          <section className={styles.historySection}>
            <h2 className={styles.sectionTitle}>Research History</h2>
            {sessionsLoading ? (
              <p className={styles.stateMsg}>Loading…</p>
            ) : sessions.length === 0 ? (
              <p className={styles.stateMsg}>
                No research sessions yet. Run a search to get started.
              </p>
            ) : (
              <ul className={styles.sessionList}>
                {sessions.map((s) => (
                  <li key={s.id} className={styles.sessionItem}>
                    <Link href={`/dashboard/research/${s.id}`} className={styles.sessionLink}>
                      <p className={styles.sessionQuery}>{s.query}</p>
                      <p className={styles.sessionMeta}>
                        {s.results.length} result{s.results.length !== 1 ? 's' : ''} ·{' '}
                        {new Date(s.createdAt).toLocaleDateString()}
                      </p>
                    </Link>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteSession(s.id)}
                      aria-label="Delete session"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
