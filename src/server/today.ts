import { createServerFn } from '@tanstack/react-start'
import { setCacheControl } from '@/server/cache'
import type { HadithPreview } from '@/lib/types/hadith'

// Reads the slim daily-hadith preview written by the daily cron (KV key
// `todayHadithPreview`, same key as the Vercel KV era). Local dev: the
// miniflare KV namespace starts empty, seed it with
//   wrangler kv key put todayHadithPreview --binding=KV --local --path=<json>
const isValidPreview = (data: unknown): data is HadithPreview => {
  const p = data as HadithPreview | null
  return Boolean(p?.book?.slug && p?.volume?.slug && p?.label)
}

export const getTodayPreview = createServerFn({ method: 'GET' }).handler(
  async (): Promise<HadithPreview | null> => {
    // Shorter than the content pages: the value flips once a day and the
    // cron will purge; 1h bounds staleness until purge wiring lands.
    await setCacheControl(3_600)
    try {
      const { env } = await import('cloudflare:workers')
      const kv = (env as { KV?: KVNamespace }).KV
      if (kv) {
        const cached = await kv.get<HadithPreview>('todayHadithPreview', 'json')
        if (isValidPreview(cached)) return cached
      }
    } catch (err) {
      console.warn('[getTodayPreview] KV read failed:', err)
    }
    return null
  },
)
