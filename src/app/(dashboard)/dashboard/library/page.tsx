'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getLibraryDocuments,
  getMyDocuments,
  getBookmarks,
  toggleBookmark,
  deleteDocument,
  getFetchErrorMessage,
  getUploadUrl,
  completeUpload,
  getAccessToken,
} from '@/lib';
import type { LibraryDocument } from '@/lib';
import { SearchIcon, DocCard, ShimmerCard } from '@/components';
import LibraryUploadModal from '@/components/LibraryUploadModal';
import styles from './page.module.scss';

type Tab = 'my' | 'free' | 'bookmarks';
const PAGE_SIZE = 12;

export default function LibraryPage() {
  return (
    <Suspense>
      <LibraryPageInner />
    </Suspense>
  );
}

function LibraryPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab and page persisted in URL
  const tab = (searchParams.get('tab') as Tab) ?? 'my';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));

  const [docs, setDocs] = useState<LibraryDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [token, setToken] = useState('');

  function setTab(t: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', t);
    params.set('page', '1');
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function setPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  const load = useCallback(async (t: string, activeTab: Tab, q: string, pg: number) => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: PAGE_SIZE, page: pg, ...(q ? { search: q } : {}) };
      const res =
        activeTab === 'my'
          ? await getMyDocuments(t, params)
          : activeTab === 'bookmarks'
            ? await getBookmarks(t, params)
            : await getLibraryDocuments(t, params);
      setDocs(res.data ?? []);
      setTotal((res.meta?.total as number) ?? res.data?.length ?? 0);
    } catch (err) {
      setError(getFetchErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = getAccessToken();
    if (!t) {
      router.replace('/login');
      return;
    }
    setToken(t);
    void load(t, tab, search, page);
  }, [router, load, tab, search, page]);

  async function handleBookmark(id: string) {
    if (!token) return;
    try {
      await toggleBookmark(id, token);
      setDocs((prev) =>
        prev.map((d) => (d._id === id ? { ...d, isBookmarked: !d.isBookmarked } : d))
      );
    } catch {
      /* silent */
    }
  }

  async function handleDelete(id: string) {
    if (!token || !confirm('Delete this document?')) return;
    try {
      await deleteDocument(id, token);
      setDocs((prev) => prev.filter((d) => d._id !== id));
    } catch (err) {
      setError(getFetchErrorMessage(err));
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className={styles.page}>
      <div className={styles.searchBar}>
        <SearchIcon size={16} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="Search documents, cases & statutes"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.tabs}>
        {(['my', 'free', 'bookmarks'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'my' ? 'My Document' : t === 'free' ? 'Free Library' : 'Marketplace'}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        <div className={styles.sectionRow}>
          <h1 className={styles.sectionTitle}>
            {tab === 'my' ? 'My Document' : tab === 'free' ? 'Free Library' : 'Marketplace'}
          </h1>
          <button className={styles.uploadBtn} onClick={() => setShowUpload(true)}>
            Upload PDF
          </button>
        </div>

        {error && (
          <p className={styles.errorMsg} role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <div className={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <ShimmerCard key={i} lines={2} />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className={styles.emptyBox}>
            <p>
              {tab === 'my'
                ? 'You have no documents yet. Upload one to get started.'
                : tab === 'bookmarks'
                  ? 'No bookmarked documents yet.'
                  : 'No documents found.'}
            </p>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {docs.map((doc) => (
                <DocCard
                  key={doc._id}
                  id={doc._id}
                  title={doc.title}
                  subject={doc.subject}
                  description={doc.description}
                  href={`/dashboard/library/${doc._id}`}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  onClick={() => setPage(Math.max(1, page - 1))}
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
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  type="button"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showUpload && (
        <LibraryUploadModal
          token={token}
          getUploadUrl={getUploadUrl}
          completeUpload={completeUpload}
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false);
            void load(token, tab, search, 1);
          }}
        />
      )}
    </div>
  );
}
