import { useCallback } from 'react';

interface NoteDraft {
  title: string;
  content: string;
  savedAt: number;
}

function key(id: string) {
  return `le-note-draft-${id}`;
}

export function useNoteDraft(id: string) {
  const read = useCallback((): NoteDraft | null => {
    try {
      const raw = localStorage.getItem(key(id));
      return raw ? (JSON.parse(raw) as NoteDraft) : null;
    } catch {
      return null;
    }
  }, [id]);

  const write = useCallback(
    (title: string, content: string) => {
      try {
        localStorage.setItem(key(id), JSON.stringify({ title, content, savedAt: Date.now() }));
      } catch {
        // storage quota — silently skip
      }
    },
    [id]
  );

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(key(id));
    } catch {
      // ignore
    }
  }, [id]);

  return { read, write, clear };
}
