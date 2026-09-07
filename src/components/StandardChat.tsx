'use client';

import { useEffect, useRef, useState } from 'react';
import { streamAiChat, getFetchErrorMessage } from '@/lib';
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

  // Auto-send initial message (e.g. search query routed from research page)
  useEffect(() => {
    if (!initialMessage || didAutoSend.current || sending) return;
    didAutoSend.current = true;
    void sendMessage(initialMessage.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  async function sendMessage(text: string) {
    if (!text || !token) return;
    setSending(true);
    setError('');

    // Add user bubble + empty assistant bubble (will fill via stream)
    setMessages((prev) => [
      ...prev,
      { role: 'user', text },
      { role: 'assistant', text: '', streaming: true },
    ]);

    try {
      abortRef.current = new AbortController();
      const gen = streamAiChat({ message: text, sessionId: currentSessionId }, token);

      let accumulated = '';
      let resolvedSessionId = currentSessionId;

      for await (const event of gen) {
        if (event.error) {
          setError(event.error);
          break;
        }
        if (event.chunk) {
          accumulated += event.chunk;
          const snapshot = accumulated;
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === 'assistant') {
              next[next.length - 1] = { ...last, text: snapshot };
            }
            return next;
          });
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        if (event.done) {
          if (event.sessionId) resolvedSessionId = event.sessionId;
        }
      }

      // Mark streaming done
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === 'assistant') {
          next[next.length - 1] = { ...last, streaming: false };
        }
        return next;
      });

      if (resolvedSessionId && resolvedSessionId !== currentSessionId) {
        setCurrentSessionId(resolvedSessionId);
        onSessionStart(resolvedSessionId);
      }
    } catch (err) {
      setError(getFetchErrorMessage(err));
      // Remove empty assistant bubble on error
      setMessages((prev) =>
        prev.filter((m, i) => !(i === prev.length - 1 && m.role === 'assistant' && !m.text))
      );
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
