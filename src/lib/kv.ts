// Minimal Workers KV wrapper exposing the @vercel/kv surface the ported code
// expects (`get`/`set` with `{ ex }`), so lib files copied from the Next.js
// app keep working unchanged apart from the import path. Values are stored as
// JSON strings, matching what @vercel/kv did implicitly.
//
// Server-only: reads the KV binding via `cloudflare:workers`. Callers already
// treat KV as best-effort (search embedding cache, daily hadith), so a
// missing binding degrades to null/no-op instead of throwing.
type SetOpts = { ex?: number }

async function binding(): Promise<KVNamespace | null> {
  try {
    const { env } = await import('cloudflare:workers')
    return (env as { KV?: KVNamespace }).KV ?? null
  } catch {
    return null
  }
}

export const kv = {
  async get<T>(key: string): Promise<T | null> {
    const ns = await binding()
    if (!ns) return null
    return ns.get<T>(key, 'json')
  },
  async set(key: string, value: unknown, opts?: SetOpts): Promise<void> {
    const ns = await binding()
    if (!ns) return
    await ns.put(
      key,
      JSON.stringify(value),
      // Workers KV enforces a 60s minimum TTL.
      opts?.ex ? { expirationTtl: Math.max(60, opts.ex) } : undefined,
    )
  },
}
