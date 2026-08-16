import turso from "./turso";
import { labelOf } from "@/lib/types/hadith";
import type { ContentEntry, HadithPreview } from "@/lib/types/hadith";
import type { SearchHighlights } from "@/lib/semantic-search";

// Unified result shape with semantic search via the shared SearchHighlights
// type. For FTS5, both `ms` and `ar` may be populated with HTML containing
// <mark> tags around matched terms (from SQLite's snippet() function).
export type TextSearchResult = HadithPreview & {
  content_index: number;
  similarity: number; // normalized BM25 score, higher = better
  highlights: SearchHighlights;
};

// FTS5 query language has special operators (", *, -, (, ), :, AND, OR, NOT).
// For user-typed queries we sanitize by:
//   1. stripping FTS5 syntax characters
//   2. splitting on whitespace
//   3. quoting each token so it's treated as a literal phrase
// Implicit-AND between tokens is the FTS5 default and the behavior we want.
const sanitizeFtsQuery = (raw: string): string => {
  const cleaned = raw
    .replace(/["()*:^]/g, " ")
    .replace(/\s+-\s+/g, " ")
    .trim();
  if (!cleaned) return "";
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  return tokens.map((t) => `"${t.replace(/"/g, "")}"`).join(" ");
};

/**
 * BM25 ranked full-text search across hadith content + chapter/volume titles.
 * Pre-filters by book_name when provided; dedupes content_index variants in
 * JS so top-k returns distinct hadiths.
 */
export const textSearchHadithWithPagination = async (
  query: string,
  _page: number = 1,
  limit: number = 20,
  bookNames?: string[],
): Promise<{
  documents: TextSearchResult[];
  totalCount: Array<{ count: number }>;
  currentPage: number;
}> => {
  const ftsQuery = sanitizeFtsQuery(query);
  if (!ftsQuery) {
    return { documents: [], totalCount: [{ count: 0 }], currentPage: 1 };
  }

  const overFetch = limit * 3;
  const args: any[] = [ftsQuery];
  let whereClause = "hadiths_fts MATCH ?";
  if (bookNames && bookNames.length > 0) {
    whereClause += ` AND hadiths_fts.book_name IN (${bookNames
      .map(() => "?")
      .join(",")})`;
    args.push(...bookNames);
  }
  args.push(overFetch);

  // snippet(table, col, mark_open, mark_close, ellipsis, max_tokens)
  // Column indexes follow CREATE VIRTUAL TABLE column order, 0-indexed:
  // 0=hadith_id, 1=content_index, 2=book_name, 3=content_ms, 4=content_ar,
  // 5=chapter_title_ms, 6=volume_title_ms
  const result = await turso.execute({
    sql: `
      SELECT
        f.hadith_id,
        f.content_index,
        bm25(hadiths_fts) AS score,
        snippet(hadiths_fts, 3, '<mark class="bg-yellow-200 font-bold">', '</mark>', '...', 24) AS snippet_ms,
        snippet(hadiths_fts, 4, '<mark class="bg-yellow-200 font-bold">', '</mark>', '...', 24) AS snippet_ar,
        h.id, h.number, h.variant, h.content,
        b.id AS book_id, b.slug AS book_slug, b.title_ms AS book_title_ms,
        v.id AS volume_id, v.slug AS volume_slug, v.title_ms AS volume_title_ms
      FROM hadiths_fts f
      JOIN hadiths h ON h.id = f.hadith_id
      JOIN books b ON b.id = h.book_id
      JOIN volumes v ON v.id = h.volume_id
      WHERE ${whereClause}
      ORDER BY score
      LIMIT ?
    `,
    args,
  });

  if (!result.rows || result.rows.length === 0) {
    return { documents: [], totalCount: [{ count: 0 }], currentPage: 1 };
  }

  // BM25 returns negative numbers, lower (more negative) = better match.
  // Normalize to a 0..1 similarity where 1 = best match in this result set.
  const scores = result.rows.map((r: any) => Number(r.score));
  const bestScore = Math.min(...scores);
  const worstScore = Math.max(...scores);
  const range = worstScore - bestScore || 1;
  const normalize = (s: number) => 1 - (s - bestScore) / range;

  const seen = new Set<string>();
  const documents: TextSearchResult[] = [];

  for (const row of result.rows as any[]) {
    const hadithId = row.id as string;
    if (seen.has(hadithId)) continue;
    seen.add(hadithId);

    const number = Number(row.number);
    const variant = (row.variant ?? null) as string | null;
    const fullContent: ContentEntry[] = row.content ? JSON.parse(row.content) : [];
    const ci = Number(row.content_index);
    const entry = fullContent[ci] ?? fullContent[0] ?? { ar: "", ms: "" };

    documents.push({
      id: row.id,
      number,
      variant,
      label: labelOf(number, variant),
      content: [{ ar: entry.ar ?? "", ms: entry.ms ?? "" }],
      book: {
        id: row.book_id,
        slug: row.book_slug,
        title_ms: row.book_title_ms ?? "",
      },
      volume: {
        id: row.volume_id,
        slug: row.volume_slug,
        title_ms: row.volume_title_ms ?? "",
      },
      content_index: ci,
      similarity: normalize(Number(row.score)),
      highlights: {
        ms: row.snippet_ms ?? undefined,
        ar: row.snippet_ar ?? undefined,
      },
    });

    if (documents.length >= limit) break;
  }

  return {
    documents,
    totalCount: [{ count: documents.length }],
    currentPage: 1,
  };
};
