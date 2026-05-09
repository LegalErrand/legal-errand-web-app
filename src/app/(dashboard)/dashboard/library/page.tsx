'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getLibraryDocuments,
  getMyDocuments,
  toggleBookmark,
  deleteDocument,
  getFetchErrorMessage,
  getUploadUrl,
  completeUpload,
} from '@/lib/api';
import { getAccessToken } from '@/lib/authStorage';
import type { LibraryDocument } from '@/lib/types';
import LibraryUploadModal from './LibraryUploadModal';
import styles from './page.module.scss';

type Tab = 'my' | 'free';

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
        : await getLibraryDocuments(t, params);
      setDocs(res.data?.data ?? []);
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
      setDocs((prev) => prev.map((d) => d.id === id ? { ...d, isBookmarked: !d.isBookmarked } : d));
    } catch { /* silent */ }
  }

  async function handleDelete(id: string) {
    if (!token || !confirm('Delete this document?')) return;
    try {
      await deleteDocument(id, token);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(getFetchErrorMessage(err));
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <h1 className={styles.pageTitle}>Library</h1>
        <button className={styles.uploadBtn} onClick={() => setShowUpload(true)}>+ Upload Document</button>
      </header>

      <div className={styles.content}>
        <div className={styles.toolbar}>
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${tab === 'my' ? styles.tabActive : ''}`} onClick={() => setTab('my')}>My Documents</button>
            <button className={`${styles.tab} ${tab === 'free' ? styles.tabActive : ''}`} onClick={() => setTab('free')}>Free Library</button>
          </div>
          <div className={styles.searchWrap}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={styles.searchIcon}>
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8" />
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input className={styles.searchInput} placeholder="Search documents…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {error && <p className={styles.errorMsg} role="alert">{error}</p>}

        {loading ? (
          <p className={styles.emptyState}>Loading…</p>
        ) : docs.length === 0 ? (
          <div className={styles.emptyBox}>
            <p>{tab === 'my' ? 'You have no documents yet. Upload one to get started.' : 'No documents found.'}</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {docs.map((doc) => (
              <div key={doc.id} className={styles.card}>
                <div className={styles.cardIcon} aria-hidden="true">📄</div>
                <div className={styles.cardBody}>
                  <Link href={`/dashboard/library/${doc.id}`} className={styles.cardTitle}>{doc.title}</Link>
                  {doc.subject && <span className={styles.cardMeta}>{doc.subject}</span>}
                  {doc.fileSize && <span className={styles.cardMeta}>{(doc.fileSize / 1024 / 1024).toFixed(1)} MB</span>}
                </div>
                <div className={styles.cardActions}>
                  <button
                    className={`${styles.bookmarkBtn} ${doc.isBookmarked ? styles.bookmarked : ''}`}
                    onClick={() => handleBookmark(doc.id)}
                    aria-label={doc.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                    title={doc.isBookmarked ? 'Bookmarked' : 'Bookmark'}
                  >
                    {doc.isBookmarked ? '★' : '☆'}
                  </button>
                  {tab === 'my' && (
                    <button className={styles.deleteBtn} onClick={() => handleDelete(doc.id)} aria-label="Delete" title="Delete">✕</button>
                  )}
                </div>
              </div>
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
