'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  explainCase,
  getCaseExplainerHistory,
  getFetchErrorMessage,
  getAccessToken,
  getLibraryDocuments,
  getMyDocuments,
} from '@/lib';
import type { CaseHistoryItem, ExplainCaseRequest, LibraryDocument } from '@/lib';
import { Spinner, Shimmer } from '@/components';
import { useToast } from '@/hooks/useToast';
import styles from './page.module.scss';

type CaseTab = 'cases';

function looksLikeCitation(input: string): boolean {
  const t = input.trim();
  if (!t || t.length > 400) return false;
  return (
    /\bv\.?\s+/i.test(t) ||
    /\bvs\.?\s+/i.test(t) ||
    /\(\d{4}\)/.test(t) ||
    /\[\d{4}\]/.test(t) ||
    /\b(NWLR|All\s?NLR|SCNLR|WRN|NCLR)\b/i.test(t)
  );
}

export default function CasesPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [activeTab, setActiveTab] = useState<CaseTab>('cases');
  const [caseText, setCaseText] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<LibraryDocument | null>(null);
  const [history, setHistory] = useState<CaseHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryDocs, setLibraryDocs] = useState<LibraryDocument[]>([]);
  const [librarySearch, setLibrarySearch] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    const t = getAccessToken();
    if (!t) {
      router.replace('/login');
      return;
    }
    setToken(t);
    void loadHistory(t);
  }, [router]);

  async function loadHistory(t: string) {
    setHistoryLoading(true);
    try {
      const res = await getCaseExplainerHistory(t, { limit: 20 });
      const raw = res.data as CaseHistoryItem[] | { data?: CaseHistoryItem[] } | undefined;
      const items = Array.isArray(raw) ? raw : (raw?.data ?? []);
      setHistory(
        items.map((item) => ({
          ...item,
          id: item.id || (item as CaseHistoryItem & { _id?: string })._id || '',
        }))
      );
    } catch {
      /* silent */
    } finally {
      setHistoryLoading(false);
    }
  }

  async function openLibraryPicker() {
    if (!token) return;
    setLibraryOpen(true);
    setLibraryLoading(true);
    try {
      const [mine, shared] = await Promise.all([
        getMyDocuments(token, { limit: 40 }),
        getLibraryDocuments(token, { limit: 40 }),
      ]);
      const merged = [...(mine.data ?? []), ...(shared.data ?? [])];
      const seen = new Set<string>();
      setLibraryDocs(
        merged.filter((doc) => {
          const id = doc.id ?? doc._id;
          if (!id || seen.has(id)) return false;
          seen.add(id);
          return true;
        })
      );
    } catch (err) {
      addToast('error', 'Could not load Library', getFetchErrorMessage(err));
      setLibraryOpen(false);
    } finally {
      setLibraryLoading(false);
    }
  }

  async function handleExplain(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const input = caseText.trim();
    if (!input && !selectedDoc) {
      setError('Enter a case name/citation, paste judgment text, or select a Library document.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const payload: ExplainCaseRequest = {};
      if (selectedDoc) {
        payload.documentId = selectedDoc.id ?? selectedDoc._id;
      } else if (looksLikeCitation(input)) {
        payload.citation = input;
        payload.text = input;
        payload.caseText = input;
      } else {
        payload.text = input;
        payload.caseText = input;
      }

      const res = await explainCase(payload, token);
      const explanationId = res.data?.id ?? res.data?._id;
      if (!explanationId) throw new Error(res.message ?? 'Explanation failed');
      try {
        sessionStorage.setItem(`le:case-explanation:${explanationId}`, JSON.stringify(res.data));
      } catch {
        /* ignore quota */
      }
      addToast('success', 'Case analysis ready');
      router.push(`/dashboard/cases/${explanationId}`);
    } catch (err) {
      const msg = getFetchErrorMessage(err);
      setError(msg);
      addToast('error', 'Analysis failed', msg);
    } finally {
      setSubmitting(false);
    }
  }

  const filteredLibrary = libraryDocs.filter((doc) => {
    if (!librarySearch.trim()) return true;
    const q = librarySearch.toLowerCase();
    return (
      doc.title.toLowerCase().includes(q) ||
      (doc.metadata?.citation ?? '').toLowerCase().includes(q) ||
      (doc.subject ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.pageTitle}>Explain a New Case</h1>
            <p className={styles.pageSub}>
              Analyse Nigerian authorities from a case name, citation, pasted judgment, or Library
              document.
            </p>
          </div>
        </div>
        <div className={styles.tabs}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'cases' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('cases')}
          >
            Cases
          </button>
          <span
            className={`${styles.tabBtn} ${styles.tabHint}`}
            title="After you analyse a case, open it from Recent Cases to view Analysis and Breakdown"
          >
            Analysis / Breakdown → open a recent case
          </span>
        </div>
      </div>

      <div className={styles.content}>
        <aside className={styles.infoCard} aria-label="How case explainer works">
          <p className={styles.infoTitle}>How to use Case Explainer</p>
          <ul className={styles.infoList}>
            <li>
              Type a case name or citation (e.g. <em>Madukolu v. Nkemdilim (1962)</em>) — we look it
              up in the Library first, then brief it from established case knowledge if needed.
            </li>
            <li>Or paste the full judgment text for a stricter, text-only analysis.</li>
            <li>Or tap Select from Library to analyse a judgment you already uploaded.</li>
            <li>Analysis and Breakdown open after you start — pick any case under Recent Cases.</li>
          </ul>
        </aside>

        <div className={styles.explainerCard}>
          <form onSubmit={handleExplain}>
            <label className={styles.inputLabel} htmlFor="case-input">
              Case name, citation, or judgment text
            </label>
            <textarea
              id="case-input"
              className={styles.textarea}
              value={caseText}
              onChange={(e) => {
                setCaseText(e.target.value);
                if (selectedDoc) setSelectedDoc(null);
              }}
              placeholder="e.g. Madukolu v. Nkemdilim (1962)  — or paste the full judgment text"
              rows={7}
            />
            {selectedDoc && (
              <p className={styles.selectedDoc}>
                Using Library document: <strong>{selectedDoc.title}</strong>
                <button
                  type="button"
                  className={styles.clearDoc}
                  onClick={() => setSelectedDoc(null)}
                >
                  Clear
                </button>
              </p>
            )}
            {error && (
              <p className={styles.formError} role="alert">
                {error}
              </p>
            )}

            <div className={styles.bottomRow}>
              <button
                type="button"
                className={styles.selectLibraryLink}
                onClick={() => void openLibraryPicker()}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                </svg>
                Select from Library
              </button>
              <button type="submit" className={styles.startBtn} disabled={submitting}>
                {submitting ? (
                  <span className={styles.btnLoading}>
                    <Spinner size={15} light /> Analysing… (usually 15–45s)
                  </span>
                ) : (
                  'Start Analysis'
                )}
              </button>
            </div>
          </form>
        </div>

        <section className={styles.historySection}>
          <h2 className={styles.sectionTitle}>Recent Cases</h2>
          {historyLoading ? (
            <ul className={styles.historyList}>
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className={styles.historyItem}>
                  <div className={styles.caseIcon} aria-hidden="true">
                    <Shimmer width={20} height={20} radius={4} />
                  </div>
                  <div className={styles.caseBody}>
                    <Shimmer height={13} width="55%" radius={5} />
                    <div style={{ height: 6 }} />
                    <Shimmer height={11} width="35%" radius={4} />
                  </div>
                </li>
              ))}
            </ul>
          ) : history.length === 0 ? (
            <p className={styles.stateMsg}>No cases explained yet. Try one above!</p>
          ) : (
            <ul className={styles.historyList}>
              {history.map((item) => (
                <li key={item.id}>
                  <Link href={`/dashboard/cases/${item.id}`} className={styles.historyItem}>
                    <div className={styles.caseIcon} aria-hidden="true">
                      ⚖
                    </div>
                    <div className={styles.caseBody}>
                      <p className={styles.caseTitle}>
                        {item.citation ?? item.title ?? 'Untitled Case'}
                      </p>
                      <p className={styles.caseMeta}>
                        {item.status && (
                          <span
                            className={`${styles.statusBadge} ${styles[`status_${item.status}`]}`}
                          >
                            {item.status}
                          </span>
                        )}
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M9 18l6-6-6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {libraryOpen && (
        <div
          className={styles.pickerOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Select library document"
        >
          <div className={styles.pickerModal}>
            <div className={styles.pickerHeader}>
              <h2 className={styles.pickerTitle}>Select from Library</h2>
              <button
                type="button"
                className={styles.pickerClose}
                onClick={() => setLibraryOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <input
              className={styles.pickerSearch}
              value={librarySearch}
              onChange={(e) => setLibrarySearch(e.target.value)}
              placeholder="Search by title or citation"
            />
            {libraryLoading ? (
              <div className={styles.pickerEmpty}>
                <Spinner size={20} />
              </div>
            ) : filteredLibrary.length === 0 ? (
              <p className={styles.pickerEmpty}>
                No documents found. Upload a judgment in Library.
              </p>
            ) : (
              <ul className={styles.pickerList}>
                {filteredLibrary.map((doc) => {
                  const id = doc.id ?? doc._id;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        className={styles.pickerItem}
                        onClick={() => {
                          setSelectedDoc(doc);
                          setCaseText(doc.metadata?.citation || doc.title);
                          setLibraryOpen(false);
                        }}
                      >
                        <span className={styles.pickerItemTitle}>{doc.title}</span>
                        <span className={styles.pickerItemMeta}>
                          {doc.metadata?.citation || doc.subject || doc.type || 'Document'}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
