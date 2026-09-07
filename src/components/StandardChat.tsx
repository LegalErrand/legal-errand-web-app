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
  /** Legacy prop — kept for API compat, not used (we stream directly) */
  sendAiChat?: unknown;
}

export default function StandardChat({ token, sessionId, initialMessage, onSessionStart }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(sessionId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const didAutoSend = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setCurrentSessionId(sessionId);
    setMessages([]);
    setError('');
    didAutoSend.current = false;
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // Auto-send initial message (e.g. search query routed from research page)
  useEffect(() => {
    if (!initialMessage || didAutoSend.current || sending) return;
    didAutoSend.current = true;
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

  async function fallbackNonStream(text: string, sessionIdForRequest?: string) {
    const res = await sendAiChat({ message: text, sessionId: sessionIdForRequest }, token);
    const reply = res.data?.reply?.trim() ?? '';
    if (!reply) {
      throw new Error(res.message ?? 'The AI returned an empty reply. Please try again.');
    }
    updateAssistantText(reply, false);
    const sid = res.data?.sessionId;
    if (sid && sid !== currentSessionId) {
      setCurrentSessionId(sid);
      onSessionStart(sid);
    }
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

    try {
      const gen = streamAiChat({ message: text, sessionId: currentSessionId }, token, signal);

      let accumulated = '';
      let resolvedSessionId = currentSessionId;
      let streamError = '';

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
        if (event.done && event.sessionId) {
          resolvedSessionId = event.sessionId;
        }
      }

      if (signal.aborted) return;

      if (!accumulated.trim()) {
        // Stream failed or returned nothing — fall back to non-stream chat.
        try {
          await fallbackNonStream(text, currentSessionId);
          return;
        } catch (fallbackErr) {
          removeEmptyAssistant();
          setError(
            streamError ||
              getFetchErrorMessage(fallbackErr) ||
              'The AI returned an empty reply. Please try again.'
          );
          return;
        }
      }

      updateAssistantText(accumulated, false);

      if (resolvedSessionId && resolvedSessionId !== currentSessionId) {
        setCurrentSessionId(resolvedSessionId);
        onSessionStart(resolvedSessionId);
      }
    } catch (err) {
      if (signal.aborted) return;
      try {
        await fallbackNonStream(text, currentSessionId);
      } catch {
        removeEmptyAssistant();
        setError(getFetchErrorMessage(err));
      }
    } finally {
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
        {messages.map((m, i) => (
          <div
            key={i}
            className={`${styles.bubble} ${m.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant}`}
          >
            <p className={styles.bubbleText}>
              {m.text}
              {m.streaming && <span className={styles.cursor} aria-hidden="true" />}
            </p>
          </div>
        ))}
        {sending && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className={`${styles.bubble} ${styles.bubbleAssistant}`}>
            <span className={styles.typingDots} aria-live="polite">
              <span />
              <span />
              <span />
            </span>
          </div>
        )}
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
