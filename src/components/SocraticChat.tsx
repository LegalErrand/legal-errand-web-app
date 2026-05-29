'use client';

import { useRef, useState } from 'react';
import { getFetchErrorMessage } from "@/lib";
import type { SocraticStartRequest, SocraticStartResponse, SocraticRespondRequest, ApiResponse } from "@/lib";
import styles from './SocraticChat.module.scss';

interface SocMsg { role: 'ai' | 'user'; text: string; }

interface Props {
  token: string;
  startSocraticSession: (data: SocraticStartRequest, token: string) => Promise<ApiResponse<SocraticStartResponse>>;
  respondSocratic: (data: SocraticRespondRequest, token: string) => Promise<ApiResponse<{ message: string }>>;
  endSocraticSession: (sessionId: string, token: string) => Promise<ApiResponse<{ summary: string; score: number }>>;
}

export default function SocraticChat({ token, startSocraticSession, respondSocratic, endSocraticSession }: Props) {
  const [phase, setPhase] = useState<'setup' | 'active' | 'ended'>('setup');
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<SocMsg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [endSummary, setEndSummary] = useState<{ summary: string; score: number } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    setBusy(true);
    setError('');
    try {
      const res = await startSocraticSession({ topic: topic.trim(), subject: subject.trim() || undefined }, token);
      if (res.data) {
        setSessionId(res.data.sessionId);
        setMessages([{ role: 'ai', text: res.data.question }]);
        setPhase('active');
      } else {
        setError(res.message ?? 'Could not start session');
      }
    } catch (err) {
      setError(getFetchErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleRespond(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setBusy(true);
    setError('');
    try {
      const res = await respondSocratic({ sessionId, message: text }, token);
      if (res.data) {
        setMessages((prev) => [...prev, { role: 'ai', text: res.data!.message }]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      } else {
        setError(res.message ?? 'No response');
      }
    } catch (err) {
      setError(getFetchErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleEnd() {
    if (!sessionId || !confirm('End this session and get your score?')) return;
    setBusy(true);
    try {
      const res = await endSocraticSession(sessionId, token);
      if (res.data) { setEndSummary(res.data); setPhase('ended'); }
    } catch (err) {
      setError(getFetchErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (phase === 'setup') {
    return (
      <div className={styles.setup}>
        <h2 className={styles.setupTitle}>Start a Socratic Session</h2>
        <p className={styles.setupSub}>Choose a topic and I&apos;ll guide you through it with questions.</p>
        <form onSubmit={handleStart} className={styles.setupForm}>
          <input className={styles.setupInput} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic (e.g. Offer and Acceptance)" />
          <input className={styles.setupInput} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject (optional, e.g. Contract Law)" />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.startBtn} disabled={busy || !topic.trim()}>
            {busy ? 'Starting…' : 'Start Session'}
          </button>
        </form>
      </div>
    );
  }

  if (phase === 'ended' && endSummary) {
    return (
      <div className={styles.summary}>
        <div className={styles.scoreCircle}>{endSummary.score}</div>
        <h2 className={styles.summaryTitle}>Session Complete</h2>
        <p className={styles.summaryText}>{endSummary.summary}</p>
        <button className={styles.restartBtn} onClick={() => { setPhase('setup'); setMessages([]); setEndSummary(null); setTopic(''); }}>
          Start New Session
        </button>
      </div>
    );
  }

  return (
    <div className={styles.chat}>
      <div className={styles.messages}>
        {messages.map((m, i) => (
          <div key={i} className={`${styles.bubble} ${m.role === 'user' ? styles.bubbleUser : styles.bubbleAI}`}>
            <p className={styles.bubbleText}>{m.text}</p>
          </div>
        ))}
        {busy && <div className={`${styles.bubble} ${styles.bubbleAI}`}><p className={styles.bubbleText} aria-live="polite">Thinking…</p></div>}
        <div ref={bottomRef} />
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.inputArea}>
        <form className={styles.inputRow} onSubmit={handleRespond}>
          <input className={styles.msgInput} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Your answer…" disabled={busy} />
          <button type="submit" className={styles.sendBtn} disabled={busy || !input.trim()}>Send</button>
        </form>
        <button className={styles.endBtn} onClick={handleEnd} disabled={busy}>End Session</button>
      </div>
    </div>
  );
}
