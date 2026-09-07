'use client';

import { useEffect, useRef, useState } from 'react';
import { streamAiChat, sendAiChat, getFetchErrorMessage } from '@/lib';
import styles from './StandardChat.module.scss';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  streaming?: boolean;
}

interface Props {
  token: string;
  sessionId?: string;
  initialMessage?: string;
  onSessionStart: (sessionId: string) => void;
  onInitialMessageConsumed?: () => void;
  /** Legacy prop — kept for API compat, not used (we stream directly) */
  sendAiChat?: unknown;
}

const STREAM_TIMEOUT_MS = 45000;

function looksIncomplete(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (t.length < 40) return true;
  if (/\|$/.test(t) || /Section\s*\|$/i.test(t)) return true;
  if (/^[A-Z]$/.test(t)) return true; // lone "I" style stubs
  return false;
}

export default function StandardChat({
  token,
  sessionId,
  initialMessage,
  onSessionStart,
  onInitialMessageConsumed,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(sessionId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const didAutoSend = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const adoptingSessionRef = useRef(false);

  // Only clear the thread when the user explicitly starts a new conversation
  // (sessionId becomes undefined). Adopting a newly created sessionId must not wipe messages.
  useEffect(() => {
    if (adoptingSessionRef.current && sessionId) {
      adoptingSessionRef.current = false;
      setCurrentSessionId(sessionId);
      return;
    }

    if (sessionId === undefined && currentSessionId !== undefined) {
      abortRef.current?.abort();
      setCurrentSessionId(undefined);
      setMessages([]);
      setError('');
      didAutoSend.current = false;
      return;
    }

    if (sessionId && sessionId !== currentSessionId && !adoptingSessionRef.current) {
      // User picked an older conversation from the sidebar — clear local draft thread.
      abortRef.current?.abort();
      setCurrentSessionId(sessionId);
      setMessages([]);
      setError('');
      didAutoSend.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!initialMessage || didAutoSend.current || sending) return;
    didAutoSend.current = true;
    onInitialMessageConsumed?.();
    void sendMessage(initialMessage.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  function updateAssistantText(text: string, streaming: boolean) {
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.role === 'assistant') {
        next[next.length - 1] = { ...last, text, streaming };
      }
      return next;
    });
  }

  function removeEmptyAssistant() {
    setMessages((prev) =>
      prev.filter((m, i) => !(i === prev.length - 1 && m.role === 'assistant' && !m.text.trim()))
    );
  }

  function adoptSession(sid: string | undefined) {
    if (!sid || sid === currentSessionId) return;
    adoptingSessionRef.current = true;
    setCurrentSessionId(sid);
    onSessionStart(sid);
  }

  async function fallbackNonStream(text: string, sessionIdForRequest?: string) {
    const res = await sendAiChat({ message: text, sessionId: sessionIdForRequest }, token);
    const reply = res.data?.reply?.trim() ?? '';
    if (!reply) {
      throw new Error(res.message ?? 'The AI returned an empty reply. Please try again.');
    }
    updateAssistantText(reply, false);
    adoptSession(res.data?.sessionId);
  }

  async function sendMessage(text: string) {
    if (!text || !token) return;
    setSending(true);
    setError('');

    setMessages((prev) => [
      ...prev,
      { role: 'user', text },
      { role: 'assistant', text: '', streaming: true },
    ]);

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;
    const timeoutId = window.setTimeout(() => abortRef.current?.abort(), STREAM_TIMEOUT_MS);

    try {
      const gen = streamAiChat({ message: text, sessionId: currentSessionId }, token, signal);

      let accumulated = '';
      let resolvedSessionId = currentSessionId;
      let streamError = '';
      let sawDone = false;

      for await (const event of gen) {
        if (signal.aborted) break;
        if (event.error) {
          streamError = event.error;
          break;
        }
        if (event.chunk) {
          accumulated += event.chunk;
          updateAssistantText(accumulated, true);
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        if (event.done) {
          sawDone = true;
          if (event.sessionId) resolvedSessionId = event.sessionId;
        }
      }

      clearTimeout(timeoutId);
      if (signal.aborted && !accumulated.trim()) {
        try {
          await fallbackNonStream(text, currentSessionId);
          return;
        } catch (fallbackErr) {
          removeEmptyAssistant();
          setError(getFetchErrorMessage(fallbackErr) || 'The AI took too long. Please try again.');
          return;
        }
      }

      const shouldFallback = Boolean(streamError) || !sawDone || looksIncomplete(accumulated);

      if (shouldFallback) {
        try {
          await fallbackNonStream(text, currentSessionId);
          return;
        } catch (fallbackErr) {
          if (accumulated.trim() && !looksIncomplete(accumulated)) {
            updateAssistantText(accumulated, false);
            adoptSession(resolvedSessionId);
            return;
          }
          removeEmptyAssistant();
          setError(
            streamError ||
              getFetchErrorMessage(fallbackErr) ||
              'The AI returned an incomplete reply. Please try again.'
          );
          return;
        }
      }

      updateAssistantText(accumulated, false);
      adoptSession(resolvedSessionId);
    } catch (err) {
      clearTimeout(timeoutId);
      if (signal.aborted) {
        try {
          await fallbackNonStream(text, currentSessionId);
          return;
        } catch (fallbackErr) {
          removeEmptyAssistant();
          setError(getFetchErrorMessage(fallbackErr));
          return;
        }
      }
      try {
        await fallbackNonStream(text, currentSessionId);
      } catch {
        removeEmptyAssistant();
        setError(getFetchErrorMessage(err));
      }
    } finally {
      clearTimeout(timeoutId);
      setSending(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    await sendMessage(text);
  }

  return (
    <div className={styles.chat}>
      <div className={styles.messages}>
        {messages.length === 0 && (
          <div className={styles.emptyChat}>
            <p className={styles.emptyChatTitle}>Ready when you are!!!</p>
            <p className={styles.emptyChatSub}>
              Ask a full legal question — concepts, cases, or statutes — for a complete answer.
            </p>
          </div>
        )}
        {messages.map((m, i) => {
          const showTyping = m.role === 'assistant' && m.streaming && !m.text.trim();
          return (
            <div
              key={i}
              className={`${styles.bubble} ${m.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant}`}
            >
              {showTyping ? (
                <span className={styles.typingDots} aria-live="polite">
                  <span />
                  <span />
                  <span />
                </span>
              ) : (
                <p className={styles.bubbleText}>
                  {m.text}
                  {m.streaming && <span className={styles.cursor} aria-hidden="true" />}
                </p>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <form className={styles.inputRow} onSubmit={handleSend}>
        <div className={styles.inputWrap}>
          <input
            className={styles.msgInput}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Legal AI a question...."
            disabled={sending}
            aria-label="Message"
          />
          <button
            type="submit"
            className={styles.sendBtn}
            disabled={sending || !input.trim()}
            aria-label="Send"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
