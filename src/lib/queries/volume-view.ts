import {
  getChaptersForVolume,
  type ChapterWithRange,
} from '@/lib/queries/chapters'
import { getHadithsForVolume } from '@/lib/queries/hadiths'
import {
  getChapterFootnotesByVolumeId,
  getHadithFootnotesByVolumeId,
  getVolumeFootnotesAsDomain,
} from '@/lib/queries/footnotes'
import { labelOf } from '@/lib/types/hadith'
import type {
  Book,
  ContentEntry,
  Footnote,
  HadithWithFootnotes,
  Volume,
} from '@/lib/types/hadith'

// Composed shape: chapter + its scoped footnotes + the hadiths within it,
// each carrying their own hadith-scope footnotes. Used by the volume-view
// API routes and the SSR volume page.
export type ChapterWithHadithsAndFootnotes = ChapterWithRange & {
  footnotes: Footnote[]
  hadiths: HadithWithFootnotes[]
}

export type VolumeView = {
  chapters: ChapterWithHadithsAndFootnotes[]
  volumeFootnotes: Footnote[]
}

export type VolumeViewOptions = {
  // Pagination over hadiths (in canonical chapter+sort_order order). When set,
  // chapters that don't have any hadiths in the returned slice are dropped
  // from the result (set `keepEmptyChapters: true` to preserve them).
  limit?: number
  offset?: number
  keepEmptyChapters?: boolean
}

// Single composition function backing /api/books/[bookId]/[volumeId],
// /api/hadiths-list, and /book/[slug]/[volume]/page.tsx. Five parallel
// indexed queries; grouping happens in JS — see the decision rationale
// in the chapter/volume decoupling history (Option B with measured data).
export async function getVolumeView(
  volume: Volume,
  book: Book,
  opts: VolumeViewOptions = {}
): Promise<VolumeView> {
  const paginated = opts.limit != null || opts.offset != null
  const [
    chapterRows,
    hadithRows,
    hadithFootnotesByHadithId,
    chapterFootnotesByChapterId,
    volumeFootnotes,
  ] = await Promise.all([
    getChaptersForVolume(volume.id),
    getHadithsForVolume(volume.id, {
      limit: opts.limit,
      offset: opts.offset,
      // Paginated responses need chapter-aware ordering so the slice respects
      // canonical reading order across chapter boundaries.
      sortByChapterThenOrder: paginated,
    }),
    getHadithFootnotesByVolumeId(volume.id),
    getChapterFootnotesByVolumeId(volume.id),
    getVolumeFootnotesAsDomain(volume.id),
  ])

  // Group hadiths by chapter_id (hadiths without a chapter land under "").
  const byChapter = new Map<string, HadithWithFootnotes[]>()
  for (const r of hadithRows) {
    const number = Number(r.number)
    const variant = (r.variant ?? null) as string | null
    const hadith: HadithWithFootnotes = {
      id: r.id,
      number,
      variant,
      label: labelOf(number, variant),
      sort_order: r.sort_order != null ? Number(r.sort_order) : null,
      mongo_id: r.mongo_id,
      content: JSON.parse(r.content || '[]') as ContentEntry[],
      audio_files: JSON.parse(r.audio_files || '{}'),
      lexicalState: r.lexicalState ? JSON.parse(r.lexicalState) : null,
      book_id: r.book_id,
      volume_id: r.volume_id,
      chapter_id: r.chapter_id ?? null,
      book,
      volume,
      // Chapter ref stays null on the hadith — the chapter object lives once
      // at the parent ChapterWithHadithsAndFootnotes level, not duplicated.
      chapter: null,
      footnotes: {
        hadith: hadithFootnotesByHadithId.get(r.id) ?? [],
        chapter: [],
        volume: [],
      },
    }
    const key = r.chapter_id ?? ''
    const arr = byChapter.get(key) ?? []
    arr.push(hadith)
    byChapter.set(key, arr)
  }

  // Build the chapter tree, optionally dropping chapters with no hadiths
  // in the current slice (default behaviour for paginated callers).
  const keepEmpty = opts.keepEmptyChapters ?? !paginated
  const chapters: ChapterWithHadithsAndFootnotes[] = chapterRows
    .filter((c) => keepEmpty || (byChapter.get(c.id)?.length ?? 0) > 0)
    .map((c) => ({
      ...c,
      footnotes: chapterFootnotesByChapterId.get(c.id) ?? [],
      hadiths: byChapter.get(c.id) ?? [],
    }))

  return { chapters, volumeFootnotes }
}
