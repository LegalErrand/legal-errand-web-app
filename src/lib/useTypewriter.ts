'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Animates text character-by-character whenever `text` changes.
 * @param text   The full target string (new value triggers fresh animation).
 * @param step   Characters revealed per interval tick (default 6).
 * @param delay  Milliseconds between ticks (default 14).
 */
export function useTypewriter(
  text: string,
  step = 6,
  delay = 14
): { displayed: string; done: boolean } {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const idxRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!text) {
      setDisplayed('');
      setDone(false);
      idxRef.current = 0;
      return;
    }

    // Reset on new text
    idxRef.current = 0;
    setDisplayed('');
    setDone(false);

    if (tickRef.current) clearInterval(tickRef.current);

    tickRef.current = setInterval(() => {
      idxRef.current = Math.min(idxRef.current + step, text.length);
      setDisplayed(text.slice(0, idxRef.current));
      if (idxRef.current >= text.length) {
        clearInterval(tickRef.current!);
        tickRef.current = null;
        setDone(true);
      }
    }, delay);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [text, step, delay]);

  return { displayed, done };
}
