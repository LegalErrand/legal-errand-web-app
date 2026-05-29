'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getLibraryDocuments, getMyDocuments, getBookmarks, toggleBookmark, deleteDocument, getFetchErrorMessage, getUploadUrl, completeUpload, getAccessToken } from "@/lib";
import type { LibraryDocument } from "@/lib";
import { SearchIcon, DocCard } from "@/components";
import LibraryUploadModal from '@/components/LibraryUploadModal';
import styles from './page.module.scss';

type Tab = 'my' | 'free' | 'bookmarks';

export default function LibraryPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('my');
  const [docs, setDocs] = useState<LibraryDocument[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [token, setToken] = useState('');

  const load = useCallback(async (t: string, activeTab: Tab, q: string) => {
    setLoading(true);
    setError('');
    try {
      const params = q ? { search: q, limit: 20 } : { limit: 20 };
      const res = activeTab === 'my'
        ? await getMyDocuments(t, params)
        : activeTab === 'bookmarks'
        ? await getBookmarks(t, params)
        : await getLibraryDocuments(t, params);
      setDocs(res.data ?? []);
    } catch (err) {
      setError(getFetchErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = getAccessToken();
    if (!t) { router.replace('/login'); return; }
    setToken(t);
    void load(t, tab, search);
  }, [router, load, tab, search]);

  async function handleBookmark(id: string) {
    if (!token) return;
    try {
      await toggleBookmark(id, token);
      setDocs((prev) => prev.map((d) => d._id === id ? { ...d, isBookmarked: !d.isBookmarked } : d));
    } catch { /* silent */ }
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

  return (
    <div className={styles.page}>
      {/* Search bar at top */}
      <div className={styles.searchBar}>
        <SearchIcon size={16} className={styles.searchIcon} />
        <input className={styles.searchInput} placeholder="Search documents, cases & statutes" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Tabs below search */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'my' ? styles.tabActive : ''}`} onClick={() => setTab('my')}>My Document</button>
        <button className={`${styles.tab} ${tab === 'free' ? styles.tabActive : ''}`} onClick={() => setTab('free')}>Free Library</button>
        <button className={`${styles.tab} ${tab === 'bookmarks' ? styles.tabActive : ''}`} onClick={() => setTab('bookmarks')}>Marketplace</button>
      </div>

      <div className={styles.content}>
        {/* Section heading + upload button */}
        <div className={styles.sectionRow}>
          <h1 className={styles.sectionTitle}>
            {tab === 'my' ? 'My Document' : tab === 'free' ? 'Free Library' : 'Marketplace'}
          </h1>
          <button className={styles.uploadBtn} onClick={() => setShowUpload(true)}>Upload PDF</button>
        </div>

        {error && <p className={styles.errorMsg} role="alert">{error}</p>}

        {loading ? (
          <p className={styles.emptyState}>Loading…</p>
        ) : docs.length === 0 ? (
          <div className={styles.emptyBox}>
            <p>{tab === 'my' ? 'You have no documents yet. Upload one to get started.' : tab === 'bookmarks' ? 'No bookmarked documents yet.' : 'No documents found.'}</p>
          </div>
        ) : (
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
        )}
      </div>

      {showUpload && (
        <LibraryUploadModal
          token={token}
          getUploadUrl={getUploadUrl}
          completeUpload={completeUpload}
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); void load(token, tab, search); }}
        />
      )}
    </div>
  );
}
