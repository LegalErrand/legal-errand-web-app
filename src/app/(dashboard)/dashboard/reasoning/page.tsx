'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  sendAiChat,
  getAiConversations,
  deleteAiConversation,
  startSocraticSession,
  respondSocratic,
  endSocraticSession,
  getFetchErrorMessage,
} from '@/lib/api';
import { getAccessToken } from '@/lib/authStorage';
import type { AiConversation } from '@/lib/types';
import StandardChat from './StandardChat';
import SocraticChat from './SocraticChat';
import styles from './page.module.scss';

type Mode = 'standard' | 'socratic';

export default function ReasoningPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [mode, setMode] = useState<Mode>('standard');
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>();
  const [convsLoading, setConvsLoading] = useState(true);
  const [initialQuery, setInitialQuery] = useState('');

  useEffect(() => {
    const t = getAccessToken();
    if (!t) { router.replace('/login'); return; }
    setToken(t);
    void loadConversations(t);
    const q = new URLSearchParams(window.location.search).get('q') ?? '';
    if (q) setInitialQuery(q);
  }, [router]);

  async function loadConversations(t: string) {
    setConvsLoading(true);
    try {
      const res = await getAiConversations(t, { limit: 30 });
      setConversations(res.data?.data ?? []);
    } catch { /* silent */ }
    finally { setConvsLoading(false); }
  }

  async function handleDeleteConv(sessionId: string) {
    if (!token || !confirm('Delete this conversation?')) return;
    try {
      await deleteAiConversation(sessionId, token);
      setConversations((prev) => prev.filter((c) => c.sessionId !== sessionId));
      if (activeSessionId === sessionId) setActiveSessionId(undefined);
    } catch { /* silent */ }
  }

  if (!token) return null;

  return (
    <div className={styles.page}>
      <div className={styles.sidebar}>
        <div className={styles.modeSwitch}>
          <button className={`${styles.modeBtn} ${mode === 'standard' ? styles.modeBtnActive : ''}`} onClick={() => setMode('standard')}>
            Standard
          </button>
          <button className={`${styles.modeBtn} ${mode === 'socratic' ? styles.modeBtnActive : ''}`} onClick={() => setMode('socratic')}>
            Socratic
          </button>
        </div>

        <div className={styles.convList}>
          <h2 className={styles.convHeading}>Conversations</h2>
          {convsLoading ? (
            <p className={styles.convEmpty}>Loading…</p>
          ) : conversations.length === 0 ? (
            <p className={styles.convEmpty}>No conversations yet.</p>
          ) : (
            conversations.map((c) => (
              <div key={c.sessionId} className={`${styles.convItem} ${activeSessionId === c.sessionId ? styles.convItemActive : ''}`}>
                <button className={styles.convBtn} onClick={() => setActiveSessionId(c.sessionId)}>
                  <span className={styles.convTitle}>{c.title ?? 'Chat'}</span>
                  <span className={styles.convMeta}>{new Date(c.createdAt).toLocaleDateString()}</span>
                </button>
                <button className={styles.delConvBtn} onClick={() => handleDeleteConv(c.sessionId)} aria-label="Delete conversation" title="Delete">✕</button>
              </div>
            ))
          )}
        </div>
      </div>

      <main className={styles.main}>
        <div className={styles.topBar}>
          <h1 className={styles.pageTitle}>{mode === 'standard' ? 'AI Chat' : 'Socratic Tutor'}</h1>
          <button className={styles.newChatBtn} onClick={() => { setActiveSessionId(undefined); }}>+ New Chat</button>
        </div>

        {mode === 'standard' ? (
          <StandardChat
            token={token}
            sessionId={activeSessionId}
            initialMessage={initialQuery}
            onSessionStart={(sid) => { setActiveSessionId(sid); void loadConversations(token); }}
            sendAiChat={sendAiChat}
          />
        ) : (
          <SocraticChat
            token={token}
            startSocraticSession={startSocraticSession}
            respondSocratic={respondSocratic}
            endSocraticSession={endSocraticSession}
          />
        )}
      </main>
    </div>
  );
}
