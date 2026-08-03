import { createServerFn } from '@tanstack/react-start'
import type { HadithPreview } from '@/lib/types/hadith'

// Reads the slim daily-hadith preview written by the cron. In production the
// value lives in the KV binding (`todayHadithPreview`, same key as the Vercel
// KV era). Local dev falls back to the production API because the local
// miniflare KV namespace starts empty.
const isValidPreview = (data: unknown): data is HadithPreview => {
  const p = data as HadithPreview | null;
  return Boolean(p?.book?.slug && p?.volume?.slug && p?.label);
};

export const getTodayPreview = createServerFn({ method: 'GET' }).handler(
  async (): Promise<HadithPreview | null> => {
    try {
      const { env } = await import('cloudflare:workers');
      const kv = (env as { KV?: KVNamespace }).KV;
      if (kv) {
        const cached = await kv.get<HadithPreview>('todayHadithPreview', 'json');
        if (isValidPreview(cached)) return cached;
      }
    } catch (err) {
      console.warn('[getTodayPreview] KV read failed:', err);
    }

    // Dev fallback: pull today's preview from production. The referer header
    // satisfies the production API gate (server-to-server, dev only).
    if (import.meta.env.DEV) {
      try {
        const res = await fetch('https://www.myway.my/api/today', {
          headers: { referer: 'https://www.myway.my/' },
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const data = await res.json();
          if (isValidPreview(data)) return data;
        }
      } catch {
        // no card in dev if prod is unreachable; fine
      }
    }

    return null;
  },
);
