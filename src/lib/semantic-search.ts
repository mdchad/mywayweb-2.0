import { createHash } from 'node:crypto';
import { kv } from '@/lib/kv';
import turso from './turso';
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import { labelOf } from '@/lib/types/hadith';
import type { ContentEntry, HadithPreview } from '@/lib/types/hadith';

// Unified highlight shape used by both semantic and FTS5 text search.
// Each field is HTML with <mark> tags around matched terms; empty for the
// semantic path (vector search has no per-keyword hits to mark).
export type SearchHighlights = {
  ms?: string;
  ar?: string;
};

export type SearchResult = HadithPreview & {
  content_index: number;
  similarity: number;
  highlights?: SearchHighlights;
};

export interface HadithSearchResult {
  hadith_id: string;
  number: number;
  variant: string | null;
  book: Pick<HadithPreview['book'], 'id' | 'slug' | 'title_ms'>;
  content: ContentEntry[];
  content_index: number;
  similarity: number;
}

export interface SearchMeta {
  cacheHit: boolean;
  embedLatencyMs: number;
  searchLatencyMs: number;
}

const MODEL_NAME = 'text-embedding-3-large';
const DIMENSIONS = 3072;
const COLUMN = 'embedding_v2';
// Bump the version segment if model or dimension changes, so old cache entries
// are ignored automatically.
const CACHE_VERSION = 'large3072:v1';
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

const hashQuery = (q: string): string =>
  createHash('sha256').update(q.trim().toLowerCase()).digest('hex').slice(0, 32);

/**
 * Embed a query, hitting Vercel KV cache if the same query was embedded
 * recently. The cache key includes the model + dim version so changing
 * either invalidates the whole cache cleanly.
 */
const embedQuery = async (
  query: string
): Promise<{ embedding: number[]; cacheHit: boolean; latencyMs: number }> => {
  const t0 = Date.now();
  const key = `embed:${CACHE_VERSION}:${hashQuery(query)}`;

  try {
    const cached = await kv.get<number[]>(key);
    if (Array.isArray(cached) && cached.length === DIMENSIONS) {
      return { embedding: cached, cacheHit: true, latencyMs: Date.now() - t0 };
    }
  } catch (err) {
    // KV failure should never block search. Fall through to OpenAI.
    console.warn('[embedQuery] KV read failed, falling through:', err);
  }

  const { embedding } = await embed({
    model: openai.embedding(MODEL_NAME),
    value: query,
    providerOptions: { openai: { dimensions: DIMENSIONS } },
  });

  // Fire-and-forget cache write. If KV is down, swallow.
  kv.set(key, embedding, { ex: CACHE_TTL_SECONDS }).catch((err) => {
    console.warn('[embedQuery] KV write failed:', err);
  });

  return { embedding, cacheHit: false, latencyMs: Date.now() - t0 };
};

/**
 * Performs semantic search on the hadith collection.
 * Returns top-k distinct hadiths (deduped by hadith_id, best content_index wins).
 *
 * Returns search metadata (cache hit, latencies) so the caller can log it.
 */
export const semanticSearchHadith = async (
  query: string,
  limit: number = 5,
  _page: number = 1,
  bookNames?: string[]
): Promise<{ results: HadithSearchResult[]; meta: SearchMeta }> => {
  const { embedding, cacheHit, latencyMs: embedLatencyMs } = await embedQuery(query);
  const embeddingStr = `[${embedding.join(',')}]`;

  // Over-fetch so we still have `limit` distinct hadiths after dedup.
  // ~93% of hadiths have a single content entry so 2x is plenty.
  const overFetch = limit * 3;

  const args: any[] = [embeddingStr];
  let whereClause = `hv.${COLUMN} IS NOT NULL`;
  if (bookNames && bookNames.length > 0) {
    whereClause += ` AND b.name IN (${bookNames.map(() => '?').join(',')})`;
    args.push(...bookNames);
  }
  args.push(overFetch);

  const t0 = Date.now();
  const result = await turso.execute({
    sql: `
      SELECT
        hv.hadith_id,
        hv.content_index,
        vector_distance_cos(hv.${COLUMN}, vector32(?)) AS distance,
        h.number, h.variant,
        b.id AS book_id, b.slug AS book_slug, b.title_ms AS book_title_ms,
        h.content
      FROM hadith_vectors hv
      JOIN hadiths h ON hv.hadith_id = h.id
      JOIN books b ON b.id = h.book_id
      WHERE ${whereClause}
      ORDER BY distance
      LIMIT ?
    `,
    args,
  });
  const searchLatencyMs = Date.now() - t0;

  // Dedup: keep the best-scoring content_index per hadith_id.
  const seen = new Set<string>();
  const results: HadithSearchResult[] = [];
  for (const row of result.rows as any[]) {
    const hadith_id = row.hadith_id as string;
    if (seen.has(hadith_id)) continue;
    seen.add(hadith_id);
    results.push({
      hadith_id,
      number: Number(row.number),
      variant: (row.variant ?? null) as string | null,
      book: {
        id: row.book_id,
        slug: row.book_slug,
        title_ms: row.book_title_ms ?? '',
      },
      content: row.content ? JSON.parse(row.content) : [],
      content_index: Number(row.content_index),
      similarity: 1 - (row.distance as number),
    });
    if (results.length >= limit) break;
  }

  return {
    results,
    meta: { cacheHit, embedLatencyMs, searchLatencyMs },
  };
};

/**
 * Semantic search for the public search page. Same model/cache/column rules,
 * dedup applied. Return shape unchanged for back-compat.
 */
export const semanticSearchWithPagination = async (
  query: string,
  _page: number = 1,
  limit: number = 20,
  bookNames?: string[]
): Promise<{
  documents: SearchResult[];
  totalCount: Array<{ count: number }>;
  currentPage: number;
}> => {
  try {
    const { embedding } = await embedQuery(query);
    const embeddingStr = `[${embedding.join(',')}]`;
    const overFetch = limit * 3;

    const args: any[] = [embeddingStr];
    let whereClause = `hv.${COLUMN} IS NOT NULL`;
    if (bookNames && bookNames.length > 0) {
      whereClause += ` AND b.name IN (${bookNames.map(() => '?').join(',')})`;
      args.push(...bookNames);
    }
    args.push(overFetch);

    const result = await turso.execute({
      sql: `
        SELECT
          hv.hadith_id,
          hv.content_index,
          vector_distance_cos(hv.${COLUMN}, vector32(?)) AS distance,
          h.id, h.number, h.variant,
          b.id AS book_id, b.slug AS book_slug, b.title_ms AS book_title_ms,
          v.id AS volume_id, v.slug AS volume_slug, v.title_ms AS volume_title_ms,
          h.content
        FROM hadith_vectors hv
        JOIN hadiths h ON hv.hadith_id = h.id
        JOIN books b ON b.id = h.book_id
        JOIN volumes v ON v.id = h.volume_id
        WHERE ${whereClause}
        ORDER BY distance
        LIMIT ?
      `,
      args,
    });

    if (!result.rows || result.rows.length === 0) {
      return { documents: [], totalCount: [{ count: 0 }], currentPage: 1 };
    }

    const seen = new Set<string>();
    const documents: SearchResult[] = [];
    for (const row of result.rows as any[]) {
      const hadith_id = row.id as string;
      if (seen.has(hadith_id)) continue;
      seen.add(hadith_id);

      const number = Number(row.number);
      const variant = (row.variant ?? null) as string | null;
      const fullContent = row.content ? JSON.parse(row.content) : [];
      const ci = Number(row.content_index);
      const entry = fullContent[ci] ?? fullContent[0] ?? { ar: '', ms: '' };

      documents.push({
        id: row.id,
        number,
        variant,
        label: labelOf(number, variant),
        content: [{ ar: entry.ar ?? '', ms: entry.ms ?? '' }],
        book: {
          id: row.book_id,
          slug: row.book_slug,
          title_ms: row.book_title_ms ?? '',
        },
        volume: {
          id: row.volume_id,
          slug: row.volume_slug,
          title_ms: row.volume_title_ms ?? '',
        },
        content_index: ci,
        similarity: 1 - (row.distance as number),
        highlights: {},
      });
      if (documents.length >= limit) break;
    }

    return {
      documents,
      totalCount: [{ count: documents.length }],
      currentPage: 1,
    };
  } catch (error) {
    console.error('[semanticSearchWithPagination] Error:', error);
    throw error;
  }
};
