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
import { Spinner, ShimmerResultItem, Shimmer } from '@/components';
import styles from './page.module.scss';

const SKIP_PREFIX_RE = /^(skip to (document |main )?content\s*)+/i;

function cleanSnippet(text: string | undefined): string {
  if (!text) return '';
  return text.replace(SKIP_PREFIX_RE, '').trim();
}

const COURT_LEVELS = ['Supreme court', 'Appeal Court', 'High Court'];
const SUBJECT_TAGS = ['Tort law', 'Cases', 'Statute', 'Principles'];
const PAGE_SIZE = 5;

export default function ResearchPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [query, setQuery] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [courtLevel, setCourtLevel] = useState('');
  const [activeSubjects, setActiveSubjects] = useState<string[]>([]);
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [refinedQuery, setRefinedQuery] = useState('');
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState('');
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Re-run search when filters change after an initial search
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
    setPage(1);
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
        setSessionId(res.data.sessionId ?? null);
        setRefinedQuery(res.data.refinedQuery ?? '');
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
    setSessionId(null);
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

  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const pageResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
              {searching ? (
                <span className={styles.btnLoading}>
                  <Spinner size={15} light /> Searching…
                </span>
              ) : (
                'Search'
              )}
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
              <div className={styles.resultsCol}>
                {searching &&
                  Array.from({ length: 4 }).map((_, i) => <ShimmerResultItem key={i} />)}
                {!searching && results.length === 0 && (
                  <p className={styles.emptyMsg}>
                    No results found. Try a different query or adjust filters.
                  </p>
                )}
                {pageResults.map((r) => (
                  <div key={r.documentId} className={styles.resultItem}>
                    <div className={styles.resultTop}>
                      <Link
                        href={sessionId ? `/dashboard/research/${sessionId}` : '#'}
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

                    {(r.snippet ?? r.excerpt) && (
                      <p className={styles.resultExcerpt}>{cleanSnippet(r.snippet ?? r.excerpt)}</p>
                    )}
                  </div>
                ))}

                {totalPages > 1 && (
                  <div className={styles.pagination}>
                    <button
                      className={styles.pageBtn}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      type="button"
                    >
                      ← Prev
                    </button>
                    <span className={styles.pageInfo}>
                      {page} / {totalPages}
                    </span>
                    <button
                      className={styles.pageBtn}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      type="button"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>

              {results.length > 0 && (
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
              )}
            </div>
          </>
        )}

        {!hasSearched && (
          <section className={styles.historySection}>
            <h2 className={styles.sectionTitle}>Research History</h2>
            {sessionsLoading ? (
              <ul className={styles.sessionList}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className={styles.sessionItem}>
                    <div className={styles.sessionLink}>
                      <Shimmer height={14} width="55%" radius={5} />
                      <div style={{ height: 6 }} />
                      <Shimmer height={11} width="30%" radius={4} />
                    </div>
                  </li>
                ))}
              </ul>
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
