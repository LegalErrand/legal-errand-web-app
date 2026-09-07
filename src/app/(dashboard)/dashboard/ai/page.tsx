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
  getCurrentUser,
  getFetchErrorMessage,
  getAccessToken,
} from '@/lib';
import type { AiConversation, AuthUserSummary } from '@/lib';
import StandardChat from '@/components/StandardChat';
import SocraticChat from '@/components/SocraticChat';
import { Spinner } from '@/components';
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
  const [user, setUser] = useState<AuthUserSummary | null>(null);

  useEffect(() => {
    const t = getAccessToken();
    if (!t) {
      router.replace('/login');
      return;
    }
    setToken(t);
    void loadConversations(t);
    void getCurrentUser(t)
      .then((res) => {
        if (res.data) setUser(res.data);
      })
      .catch(() => undefined);
    const q = new URLSearchParams(window.location.search).get('q') ?? '';
    if (q) setInitialQuery(q);
  }, [router]);

  async function loadConversations(t: string) {
    setConvsLoading(true);
    try {
      const res = await getAiConversations(t, { limit: 30 });
      setConversations(res.data?.data ?? []);
    } catch {
      /* silent */
    } finally {
      setConvsLoading(false);
    }
  }

  async function handleDeleteConv(sessionId: string) {
    if (!token || !confirm('Delete this conversation?')) return;
    try {
      await deleteAiConversation(sessionId, token);
      setConversations((prev) => prev.filter((c) => c.sessionId !== sessionId));
      if (activeSessionId === sessionId) setActiveSessionId(undefined);
    } catch {
      /* silent */
    }
  }

  if (!token) return null;

  return (
    <div className={styles.page}>
      {/* Left sidebar — own logo, chat history, new conv button */}
      <div className={styles.sidebar}>
        <div className={styles.logoWrap}>
          <svg width="120" height="28" viewBox="0 0 140 32" fill="none" aria-label="LegalErrand">
            <text
              x="0"
              y="24"
              fontFamily="sans-serif"
              fontWeight="700"
              fontSize="18"
              fill="#D97706"
            >
              LegalErrand
            </text>
          </svg>
        </div>

        <p className={styles.chatHistoryLabel}>Chat history</p>

        <button className={styles.newConvBtn} onClick={() => setActiveSessionId(undefined)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          New conversation
        </button>

        <hr className={styles.sidebarDivider} />

        <div className={styles.convList}>
          {convsLoading ? (
            <div className={styles.convEmpty}>
              <Spinner size={18} />
            </div>
          ) : conversations.length === 0 ? (
            <p className={styles.convEmpty}>No conversations yet.</p>
          ) : (
            conversations.map((c) => (
              <div
                key={c.sessionId}
                className={`${styles.convItem} ${activeSessionId === c.sessionId ? styles.convItemActive : ''}`}
              >
                <button className={styles.convBtn} onClick={() => setActiveSessionId(c.sessionId)}>
                  <span className={styles.convTitle}>{c.title ?? 'Chat'}</span>
                  <span className={styles.convMeta}>
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </button>
                <button
                  className={styles.delConvBtn}
                  onClick={() => handleDeleteConv(c.sessionId)}
                  aria-label="Delete conversation"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {user && (
          <div className={styles.userRow}>
            <div className={styles.userAvatar} aria-label="User profile" />
            <div className={styles.userInfo}>
              <span className={styles.userName}>
                {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'Student'}
              </span>
              <span className={styles.userRole}>Student</span>
            </div>
          </div>
        )}
      </div>

      {/* Main content area */}
      <main className={styles.main}>
        {/* Top bar: mode toggle + bell + avatar */}
        <div className={styles.mainTopBar}>
          <div className={styles.modePills}>
            <button
              className={`${styles.modePill} ${mode === 'standard' ? styles.modePillActive : ''}`}
              onClick={() => setMode('standard')}
              title="Ask Legal AI for direct answers and explanations"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M13 2L3 14h9l-1 8 10-12h-9l1-8Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
              Standard
            </button>
            <button
              className={`${styles.modePill} ${mode === 'socratic' ? styles.modePillActive : ''}`}
              onClick={() => setMode('socratic')}
              title="Guided Q&A that coaches you toward the answer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 2a7 7 0 0 1 7 7c0 2.7-1.52 5.05-3.75 6.28L15 21H9l.75-5.72A7 7 0 0 1 5 9a7 7 0 0 1 7-7Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
              Socratic
            </button>
          </div>

          <div className={styles.topBarActions}>
            <button className={styles.bellBtn} aria-label="Notifications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button className={styles.avatarBtn} aria-label="User menu" />
          </div>
        </div>

        <aside className={styles.modeInfo} aria-live="polite">
          {mode === 'standard' ? (
            <>
              <strong>Standard</strong> gives direct explanations (concepts, cases, statutes). Ask a
              full question for the best answer.
            </>
          ) : (
            <>
              <strong>Socratic</strong> coaches you with follow-up questions instead of dumping the
              full answer at once.
            </>
          )}
        </aside>

        {mode === 'standard' ? (
          <StandardChat
            token={token}
            sessionId={activeSessionId}
            initialMessage={initialQuery}
            onSessionStart={(sid) => {
              setActiveSessionId(sid);
              void loadConversations(token);
            }}
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
