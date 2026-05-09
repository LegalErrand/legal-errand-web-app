'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getLibraryDocument, getSignedDownloadUrl, getFetchErrorMessage } from '@/lib/api';
import { getAccessToken } from '@/lib/authStorage';
import type { LibraryDocument } from '@/lib/types';
import styles from './page.module.scss';

export default function LibraryDocumentPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<LibraryDocument | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { router.replace('/login'); return; }
    if (!id) return;

    void (async () => {
      try {
        const [docRes, urlRes] = await Promise.allSettled([
          getLibraryDocument(id, token),
          getSignedDownloadUrl(id, token),
        ]);
        if (docRes.status === 'fulfilled' && docRes.value.data) {
          setDoc(docRes.value.data);
        }
        if (urlRes.status === 'fulfilled' && urlRes.value.data) {
          setPdfUrl(urlRes.value.data.signedUrl);
        }
      } catch (err) {
        setError(getFetchErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [router, id]);

  if (loading) return <div className={styles.page}><p className={styles.state}>Loading…</p></div>;
  if (error) return <div className={styles.page}><p className={styles.stateError}>{error}</p></div>;
  if (!doc) return <div className={styles.page}><p className={styles.state}>Document not found.</p></div>;

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <Link href="/dashboard/library" className={styles.backBtn}>← Library</Link>
        <div className={styles.docMeta}>
          <h1 className={styles.docTitle}>{doc.title}</h1>
          {doc.subject && <span className={styles.docSubject}>{doc.subject}</span>}
        </div>
        {pdfUrl && (
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className={styles.downloadBtn}>
            Download
          </a>
        )}
      </header>

      <div className={styles.viewerWrap}>
        {pdfUrl ? (
          <iframe
            className={styles.pdfViewer}
            src={pdfUrl}
            title={doc.title}
            aria-label={`PDF viewer for ${doc.title}`}
          />
        ) : (
          <div className={styles.noPreview}>
            <p>Preview not available.</p>
            {doc.s3Url && (
              <a href={doc.s3Url} target="_blank" rel="noopener noreferrer" className={styles.downloadBtn}>
                Open Document
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
