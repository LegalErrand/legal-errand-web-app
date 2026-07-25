'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getLibraryDocuments,
  getMyDocuments,
  getFetchErrorMessage,
  getUploadUrl,
  completeUpload,
  getAccessToken,
} from '@/lib';
import type { LibraryDocument } from '@/lib';
import { ShimmerCard } from '@/components';
import LibraryUploadModal from '@/components/LibraryUploadModal';
import styles from './page.module.scss';

type Tab = 'my-document' | 'free-library' | 'marketplace';

const FREE_SUBJECTS = [
  'All Resources',
  'Constitutional Law',
  'Torts',
  'Criminal Procedure',
  'Taxation',
] as const;
type FreeSubject = (typeof FREE_SUBJECTS)[number];

function BookIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"
        stroke="white"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function DocCover() {
  return (
    <div className={styles.docCover}>
      <div className={styles.docCoverInner}>
        <BookIcon />
      </div>
    </div>
  );
}

function DocCard({ doc, cta = 'Read' }: { doc: LibraryDocument; cta?: string }) {
  return (
    <div className={styles.docCard}>
      <DocCover />
      <h3 className={styles.docTitle}>{doc.title}</h3>
      {doc.description && <p className={styles.docDesc}>{doc.description}</p>}
      <Link href={`/dashboard/library/${doc._id}`} className={styles.docReadBtn}>
        {cta} →
      </Link>
    </div>
  );
}

function EmptyMyDocs({ onUpload }: { onUpload: () => void }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <polyline
            points="17 8 12 3 7 8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="12"
            y1="3"
            x2="12"
            y2="15"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p className={styles.emptyTitle}>No documents yet</p>
      <p className={styles.emptySub}>Upload your first PDF to get started</p>
      <button className={styles.uploadBtnPrimary} onClick={onUpload}>
        Upload PDF
      </button>
    </div>
  );
}

export default function LibraryPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [tab, setTab] = useState<Tab>('my-document');
  const [myDocs, setMyDocs] = useState<LibraryDocument[]>([]);
  const [freeDocs, setFreeDocs] = useState<LibraryDocument[]>([]);
  const [freeSubject, setFreeSubject] = useState<FreeSubject>('All Resources');
  const [search, setSearch] = useState('');
  const [myLoading, setMyLoading] = useState(true);
  const [freeLoading, setFreeLoading] = useState(false);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  const loadMyDocs = useCallback(async (t: string, q?: string) => {
    setMyLoading(true);
    setError('');
    try {
      const res = await getMyDocuments(t, { limit: 50, ...(q ? { search: q } : {}) });
      setMyDocs(res.data ?? []);
    } catch (err) {
      setError(getFetchErrorMessage(err));
    } finally {
      setMyLoading(false);
    }
  }, []);

  const loadFreeDocs = useCallback(async (t: string, subject?: string) => {
    setFreeLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = { limit: 50, type: 'free' };
      if (subject && subject !== 'All Resources') params.subject = subject;
      const res = await getLibraryDocuments(t, params as Parameters<typeof getLibraryDocuments>[1]);
      setFreeDocs(res.data ?? []);
    } catch (err) {
      setError(getFetchErrorMessage(err));
    } finally {
      setFreeLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = getAccessToken();
    if (!t) {
      router.replace('/login');
      return;
    }
    setToken(t);
    void loadMyDocs(t);
  }, [router, loadMyDocs]);

  useEffect(() => {
    if (!token) return;
    if (tab === 'free-library') void loadFreeDocs(token, freeSubject);
  }, [tab, freeSubject, token, loadFreeDocs]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (tab === 'my-document') void loadMyDocs(token, search);
  }

  return (
    <div className={styles.page}>
      {/* Top search bar */}
      <div className={styles.topBar}>
        <form className={styles.searchWrap} onSubmit={handleSearch}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            className={styles.searchIcon}
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M21 21l-4.35-4.35"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          <input
            className={styles.searchInput}
            placeholder="Search archives, statutes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
      </div>

      {/* Tabs */}
      <div className={styles.tabRow}>
        {(['my-document', 'free-library', 'marketplace'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'my-document'
              ? 'My Document'
              : t === 'free-library'
                ? 'Free Library'
                : 'Marketplace'}
          </button>
        ))}
      </div>

      {error && (
        <p className={styles.errorMsg} role="alert">
          {error}
        </p>
      )}

      {/* ── My Document ── */}
      {tab === 'my-document' && (
        <div className={styles.content}>
          <div className={styles.contentHeader}>
            <div>
              <h1 className={styles.pageTitle}>My Document</h1>
            </div>
            <button className={styles.uploadBtn} onClick={() => setShowUpload(true)}>
              Upload PDF
            </button>
          </div>

          {myLoading ? (
            <div className={styles.docGrid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <ShimmerCard key={i} lines={2} />
              ))}
            </div>
          ) : myDocs.length === 0 ? (
            <EmptyMyDocs onUpload={() => setShowUpload(true)} />
          ) : (
            <div className={styles.docGrid}>
              {myDocs.map((doc) => (
                <DocCard key={doc._id} doc={doc} cta="Read" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Free Library ── */}
      {tab === 'free-library' && (
        <div className={styles.content}>
          <div className={styles.freeHeader}>
            <span className={styles.openAccessBadge}>OPEN ACCESS</span>
            <h1 className={styles.pageTitle}>Free Library</h1>
            <p className={styles.pageSub}>
              Access verified copies of the Nigerian constitution, statutes, and landmark Supreme
              Court rulings curated by legal experts.
            </p>
          </div>

          <div className={styles.filterRow}>
            {FREE_SUBJECTS.map((s) => (
              <button
                key={s}
                className={`${styles.filterChip} ${freeSubject === s ? styles.filterChipActive : ''}`}
                onClick={() => setFreeSubject(s)}
              >
                {s}
              </button>
            ))}
          </div>

          {freeLoading ? (
            <div className={styles.docGrid}>
              {Array.from({ length: 9 }).map((_, i) => (
                <ShimmerCard key={i} lines={2} />
              ))}
            </div>
          ) : freeDocs.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>No documents in this category yet.</p>
            </div>
          ) : (
            <div className={styles.docGrid}>
              {freeDocs.map((doc) => (
                <DocCard key={doc._id} doc={doc} cta="Start Reading" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Marketplace ── */}
      {tab === 'marketplace' && (
        <div className={styles.content}>
          <div className={styles.contentHeader}>
            <div>
              <h1 className={styles.pageTitle}>Marketplace</h1>
              <p className={styles.pageSub}>Premium legal resources and study materials</p>
            </div>
          </div>
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>Coming Soon</p>
            <p className={styles.emptySub}>
              Premium marketplace resources will be available shortly.
            </p>
          </div>
        </div>
      )}

      {showUpload && (
        <LibraryUploadModal
          token={token}
          getUploadUrl={getUploadUrl}
          completeUpload={completeUpload}
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false);
            void loadMyDocs(token);
          }}
        />
      )}
    </div>
  );
}
