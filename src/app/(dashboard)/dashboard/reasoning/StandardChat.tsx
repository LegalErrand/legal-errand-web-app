'use client';

import { useEffect, useRef, useState } from 'react';
import { getFetchErrorMessage } from '@/lib/api';
import type { AiChatRequest, AiChatResponse, ApiResponse } from '@/lib/types';
import styles from './StandardChat.module.scss';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface Props {
  token: string;
  sessionId?: string;
  initialMessage?: string;
  onSessionStart: (sessionId: string) => void;
  sendAiChat: (data: AiChatRequest, token: string) => Promise<ApiResponse<AiChatResponse>>;
}

export default function StandardChat({ token, sessionId, initialMessage, onSessionStart, sendAiChat }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(sessionId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const didAutoSend = useRef(false);

  useEffect(() => {
    setCurrentSessionId(sessionId);
    setMessages([]);
    setError('');
  }, [sessionId]);

  useEffect(() => {
    if (!initialMessage || didAutoSend.current || sending) return;
    didAutoSend.current = true;
    const text = initialMessage.trim();
    if (!text) return;
    setMessages([{ role: 'user', text }]);
    setSending(true);
    void sendAiChat({ message: text, sessionId: currentSessionId }, token).then((res) => {
      if (res.data) {
        if (!currentSessionId) {
          setCurrentSessionId(res.data.sessionId);
          onSessionStart(res.data.sessionId);
        }
        setMessages((prev) => [...prev, { role: 'assistant', text: res.data!.reply }]);
      } else {
        setError(res.message ?? 'No response received');
      }
    }).catch((err: unknown) => {
      setError(getFetchErrorMessage(err));
    }).finally(() => {
      setSending(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setSending(true);
    setError('');

    try {
      const res = await sendAiChat({ message: text, sessionId: currentSessionId }, token);
      if (res.data) {
        if (!currentSessionId) {
          setCurrentSessionId(res.data.sessionId);
          onSessionStart(res.data.sessionId);
        }
        setMessages((prev) => [...prev, { role: 'assistant', text: res.data!.reply }]);
      } else {
        setError(res.message ?? 'No response received');
      }
    } catch (err) {
      setError(getFetchErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={styles.chat}>
      <div className={styles.messages}>
        {messages.length === 0 && (
          <div className={styles.emptyChat}>
            <p className={styles.emptyChatTitle}>Ask me anything about law</p>
            <p className={styles.emptyChatSub}>Cases, statutes, legal principles — I&apos;m here to help.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`${styles.bubble} ${m.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant}`}>
            <p className={styles.bubbleText}>{m.text}</p>
          </div>
        ))}
        {sending && (
          <div className={`${styles.bubble} ${styles.bubbleAssistant}`}>
            <p className={styles.bubbleText} aria-live="polite">Thinking…</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}

      <form className={styles.inputRow} onSubmit={handleSend}>
        <input
          className={styles.msgInput}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a legal question…"
          disabled={sending}
          aria-label="Message"
        />
        <button type="submit" className={styles.sendBtn} disabled={sending || !input.trim()} aria-label="Send">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
    </div>
  );
}
