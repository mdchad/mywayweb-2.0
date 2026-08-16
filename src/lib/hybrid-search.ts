import { semanticSearchWithPagination, type SearchResult } from "./semantic-search";
import {
  textSearchHadithWithPagination,
  type TextSearchResult,
} from "./text-search";

// Reciprocal Rank Fusion constant from Cormack/Clarke/Buettcher 2009. The
// classic default. Higher k flattens the rank-weight curve (lessens head bias),
// lower k sharpens it. 60 is the universally-cited starting point and needs
// no tuning across most corpora.
const RRF_K = 60;

/**
 * Hybrid search via Reciprocal Rank Fusion of dense (vector cosine on
 * embedding_v2) and sparse (FTS5 BM25) retrievers.
 *
 * Each leg is queried independently with an over-fetched window. For every
 * candidate, a fused score is computed as the sum of 1/(k + rank)
 * contributions from whichever leg returned it. Candidates appearing in both
 * lists naturally bubble to the top; single-leg hits still score but lower.
 *
 * Results are deduped by hadith_id (best content_index wins) and rendered
 * with FTS5 highlights when available — semantic-only survivors render
 * without <mark> tags.
 *
 * Not currently exposed in the UI. Available via `mode=hybrid` on the search
 * API for evaluation.
 */
export const hybridSearchHadith = async (
  query: string,
  _page: number = 1,
  limit: number = 20,
  bookNames?: string[],
): Promise<{
  documents: SearchResult[];
  totalCount: Array<{ count: number }>;
  currentPage: number;
}> => {
  if (!query.trim()) {
    return { documents: [], totalCount: [{ count: 0 }], currentPage: 1 };
  }

  // Over-fetch each leg so the fused top-N still has good recall after
  // intersection drop-off. 3x limit, floored at 60, is a healthy window.
  const legLimit = Math.max(limit * 3, 60);

  const [semanticResult, textResult] = await Promise.all([
    semanticSearchWithPagination(query, 1, legLimit, bookNames),
    textSearchHadithWithPagination(query, 1, legLimit, bookNames),
  ]);

  type Fused = {
    rrf: number;
    record: SearchResult | TextSearchResult;
    fts?: TextSearchResult;
  };

  const fused = new Map<string, Fused>();
  const keyOf = (r: { id: string; content_index: number }): string =>
    `${r.id}:${r.content_index}`;

  semanticResult.documents.forEach((doc, i) => {
    fused.set(keyOf(doc), {
      rrf: 1 / (RRF_K + (i + 1)),
      record: doc,
    });
  });

  textResult.documents.forEach((doc, i) => {
    const key = keyOf(doc);
    const contribution = 1 / (RRF_K + (i + 1));
    const prev = fused.get(key);
    if (prev) {
      prev.rrf += contribution;
      prev.fts = doc;
    } else {
      fused.set(key, { rrf: contribution, record: doc, fts: doc });
    }
  });

  // Sort by fused score desc, then dedupe by hadith_id keeping the first
  // occurrence (which is the highest-ranking content_index for that hadith).
  const sorted = [...fused.values()].sort((a, b) => b.rrf - a.rrf);
  const seenHadith = new Set<string>();
  const documents: SearchResult[] = [];

  for (const f of sorted) {
    if (seenHadith.has(f.record.id)) continue;
    seenHadith.add(f.record.id);

    // Prefer the FTS5 row when present so the <mark>-tagged snippet survives
    // to the UI. Semantic-only winners render without highlights — that's an
    // accepted UX cost of fusion.
    const base = f.fts ?? f.record;
    documents.push({
      ...base,
      similarity: f.rrf,
      highlights: f.fts?.highlights ?? {},
    });

    if (documents.length >= limit) break;
  }

  return {
    documents,
    totalCount: [{ count: documents.length }],
    currentPage: 1,
  };
};
