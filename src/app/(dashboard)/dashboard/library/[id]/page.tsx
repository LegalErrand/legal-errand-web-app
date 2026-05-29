'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getLibraryDocument, getSignedDownloadUrl, getFetchErrorMessage, getAccessToken } from "@/lib";
import type { LibraryDocument } from "@/lib";
import LibraryAIPanel from '@/components/LibraryAIPanel';
import pStyles from './page.module.scss';
import cStyles from './LibraryContent.module.scss';
const styles = { ...pStyles, ...cStyles };

const SECTION_RE = /^([A-Z][A-Z\s/&]+)$/;

function extractHeadings(text: string): string[] {
  return text.split('\n').map(l => l.trim()).filter(l => SECTION_RE.test(l));
}

function CaseTextReader({ text }: { text: string }) {
  const lines = text.split('\n');
  const nodes: { type: 'heading' | 'para'; text: string }[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (SECTION_RE.test(line)) nodes.push({ type: 'heading', text: line });
    else nodes.push({ type: 'para', text: line });
  }
  return (
    <div className={styles.caseReader}>
      {nodes.map((n, i) => n.type === 'heading'
        ? <h2 key={i} className={styles.caseSection}>{n.text}</h2>
        : <p key={i} className={styles.casePara}>{n.text}</p>
      )}
    </div>
  );
}

export default function LibraryDocumentPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<LibraryDocument | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [urlError, setUrlError] = useState('');
  const [activeHeading, setActiveHeading] = useState('');

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
        } else if (docRes.status === 'rejected') {
          setError(getFetchErrorMessage(docRes.reason));
        }
        if (urlRes.status === 'fulfilled' && urlRes.value.data?.signedUrl) {
          setPdfUrl(urlRes.value.data.signedUrl);
        } else if (urlRes.status === 'rejected') {
          const msg = (urlRes.reason as { response?: { data?: { message?: string } } })
            ?.response?.data?.message ?? getFetchErrorMessage(urlRes.reason);
          setUrlError(msg);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [router, id]);

  if (loading) return <div className={styles.page}><p className={styles.state}>Loading…</p></div>;
  if (error) return <div className={styles.page}><p className={styles.stateError}>{error}</p></div>;
  if (!doc) return <div className={styles.page}><p className={styles.state}>Document not found.</p></div>;

  const caseText = doc.metadata?.description ?? null;
  const headings = caseText ? extractHeadings(caseText) : [];

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <Link href="/dashboard/library" className={styles.backBtn}>← Library</Link>
        <div className={styles.docMeta}>
          <h1 className={styles.docTitle}>{doc.title}</h1>
          <div className={styles.docMetaRow}>
            {doc.subject && <span className={styles.docSubject}>{doc.subject}</span>}
            {doc.metadata?.court && <span className={styles.docMetaChip}>{doc.metadata.court}</span>}
            {doc.metadata?.year && <span className={styles.docMetaChip}>{doc.metadata.year}</span>}
            {doc.metadata?.citation && <span className={styles.docMetaChip}>{doc.metadata.citation}</span>}
          </div>
        </div>
        {pdfUrl && (
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className={styles.downloadBtn}>
            Download PDF
          </a>
        )}
      </header>

      <div className={styles.viewerLayout}>
        <aside className={styles.chaptersPanel}>
          <p className={styles.chaptersPanelTitle}>Contents</p>
          {headings.length > 0 ? headings.map((h, i) => (
            <button key={i} type="button"
              className={`${styles.chapterItem} ${activeHeading === h ? styles.chapterItemActive : ''}`}
              onClick={() => setActiveHeading(h)}>{h}</button>
          )) : (
            <p className={styles.chaptersEmpty}>No sections found.</p>
          )}
        </aside>

        <div className={styles.centerPanel}>
          {pdfUrl ? (
            <>
              <iframe className={styles.pdfViewer} src={pdfUrl} title={doc.title} aria-label={`PDF viewer for ${doc.title}`} />
              <div className={styles.pdfFallback}>
                <p>If the PDF doesn&apos;t appear,</p>
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className={styles.downloadBtn}>Open PDF in new tab</a>
              </div>
            </>
          ) : urlError ? (
            <div className={styles.noPreview}><p className={styles.stateError}>{urlError}</p></div>
          ) : caseText ? (
            <CaseTextReader text={caseText} />
          ) : (
            <div className={styles.noPreview}><p>No preview available for this document.</p></div>
          )}
        </div>

        <LibraryAIPanel docTitle={doc.title} docSubject={doc.subject} />
      </div>
    </div>
  );
}
