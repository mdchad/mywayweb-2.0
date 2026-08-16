import { db } from '@/lib/db'
import type { Footnote, FootnoteScope as DomainFootnoteScope } from '@/lib/types/hadith'

export type FootnoteScope = 'hadith' | 'chapter' | 'volume'

export type FootnoteInput = {
  type: string
  language: 'ms' | 'ar' | 'en' | null
  number: number
  position: number
  hadith_index: number | null
  content: string
}

export type FootnoteRow = FootnoteInput & {
  id: number
  base_type: string | null
}

const baseTypeOf = (type: string) => type.split('.')[0] || null

const SELECTED_FOOTNOTE_COLUMNS = [
  'id',
  'type',
  'base_type',
  'language',
  'number',
  'position',
  'hadith_index',
  'content',
] as const

export async function getHadithFootnotes(
  hadithId: string
): Promise<FootnoteRow[]> {
  const rows = await db
    .selectFrom('hadith_footnotes')
    .select(SELECTED_FOOTNOTE_COLUMNS)
    .where('hadith_id', '=', hadithId)
    .where('scope', '=', 'hadith')
    .orderBy('number', 'asc')
    .execute()
  return rows as FootnoteRow[]
}

export async function getChapterFootnotes(
  chapterId: string
): Promise<FootnoteRow[]> {
  const rows = await db
    .selectFrom('chapter_footnotes')
    .select(SELECTED_FOOTNOTE_COLUMNS)
    .where('chapter_id', '=', chapterId)
    .orderBy('number', 'asc')
    .execute()
  return rows as FootnoteRow[]
}

export async function getVolumeFootnotes(
  volumeId: string
): Promise<FootnoteRow[]> {
  const rows = await db
    .selectFrom('volume_footnotes')
    .select(SELECTED_FOOTNOTE_COLUMNS)
    .where('volume_id', '=', volumeId)
    .orderBy('number', 'asc')
    .execute()
  return rows as FootnoteRow[]
}

// Map a raw FootnoteRow into the canonical domain Footnote shape used by API
// responses. Mirrors the inline mapper that was duplicated across pages.
const toDomainFootnote =
  (scope: DomainFootnoteScope) =>
  (r: FootnoteRow): Footnote => ({
    id: Number(r.id),
    scope,
    type: r.type,
    base_type: r.base_type ?? null,
    language: r.language ?? null,
    position: Number(r.position),
    number: Number(r.number),
    hadith_index: r.hadith_index != null ? Number(r.hadith_index) : null,
    content: r.content,
  })

// Bulk fetchers: pull all hadith-scope footnotes for a volume in one query,
// then group by hadith_id on the JS side. Replaces the per-row correlated
// json_group_array subquery that was used by the volume view pages.
export async function getHadithFootnotesByVolumeId(
  volumeId: string
): Promise<Map<string, Footnote[]>> {
  const rows = await db
    .selectFrom('hadith_footnotes as f')
    .innerJoin('hadiths as h', 'h.id', 'f.hadith_id')
    .select([
      'f.id',
      'f.hadith_id',
      'f.type',
      'f.base_type',
      'f.language',
      'f.position',
      'f.number',
      'f.hadith_index',
      'f.content',
    ])
    .where('h.volume_id', '=', volumeId)
    .where('f.scope', '=', 'hadith')
    .orderBy('f.hadith_id')
    .orderBy('f.number')
    .execute()

  const byHadith = new Map<string, Footnote[]>()
  const toFn = toDomainFootnote('hadith')
  for (const r of rows) {
    const arr = byHadith.get(r.hadith_id) ?? []
    arr.push(toFn(r as FootnoteRow))
    byHadith.set(r.hadith_id, arr)
  }
  return byHadith
}

export async function getChapterFootnotesByVolumeId(
  volumeId: string
): Promise<Map<string, Footnote[]>> {
  const rows = await db
    .selectFrom('chapter_footnotes as f')
    .innerJoin('chapters as c', 'c.id', 'f.chapter_id')
    .select([
      'f.id',
      'f.chapter_id',
      'f.type',
      'f.base_type',
      'f.language',
      'f.position',
      'f.number',
      'f.hadith_index',
      'f.content',
    ])
    .where('c.volume_id', '=', volumeId)
    .orderBy('f.chapter_id')
    .orderBy('f.number')
    .execute()

  const byChapter = new Map<string, Footnote[]>()
  const toFn = toDomainFootnote('chapter')
  for (const r of rows) {
    const arr = byChapter.get(r.chapter_id) ?? []
    arr.push(toFn(r as FootnoteRow))
    byChapter.set(r.chapter_id, arr)
  }
  return byChapter
}

// Single-volume footnotes already exposed as Footnote[] for caller convenience.
export async function getVolumeFootnotesAsDomain(
  volumeId: string
): Promise<Footnote[]> {
  const rows = await getVolumeFootnotes(volumeId)
  return rows.map(toDomainFootnote('volume'))
}

// Hadith-scoped footnotes for one hadith, returned as canonical Footnote[].
export async function getHadithFootnotesAsDomain(
  hadithId: string
): Promise<Footnote[]> {
  const rows = await getHadithFootnotes(hadithId)
  return rows.map(toDomainFootnote('hadith'))
}

// Chapter-scoped footnotes for one chapter, returned as canonical Footnote[].
export async function getChapterFootnotesAsDomain(
  chapterId: string
): Promise<Footnote[]> {
  const rows = await getChapterFootnotes(chapterId)
  return rows.map(toDomainFootnote('chapter'))
}

// Legacy admin-form footnote shape: ms/ar/en as separate keys on the same
// row, no language column. Used by the hadith edit form.
export type LegacyFormFootnote = {
  type: string
  ms: string
  ar: string
  en: string
  number: number
  position: number
  hadithIndex: number
}

const toLegacyShape = (r: FootnoteRow): LegacyFormFootnote => ({
  type: r.type,
  ms: r.language === 'ms' ? r.content : '',
  ar: r.language === 'ar' ? r.content : '',
  en: r.language === 'en' ? r.content : '',
  number: r.number,
  position: r.position,
  hadithIndex: r.hadith_index ?? 0,
})

// Union of hadith/chapter/volume scoped footnotes, all from canonical tables,
// in legacy form shape. Pass null for chapter/volume id if the hadith is not
// linked to one (shouldn't happen in practice).
export async function getAdminFootnoteUnion(
  hadithId: string,
  chapterId: string | null,
  volumeId: string | null
): Promise<LegacyFormFootnote[]> {
  const [hadithRows, chapterRows, volumeRows] = await Promise.all([
    getHadithFootnotes(hadithId),
    chapterId ? getChapterFootnotes(chapterId) : Promise.resolve([]),
    volumeId ? getVolumeFootnotes(volumeId) : Promise.resolve([]),
  ])

  return [...hadithRows, ...chapterRows, ...volumeRows].map(toLegacyShape)
}

// Replace all hadith-scope footnotes for a hadith atomically.
// Legacy chapter/volume rows in hadith_footnotes are left untouched (filtered
// by scope = 'hadith' in the DELETE).
export async function replaceHadithFootnotes(
  hadithId: string,
  footnotes: FootnoteInput[]
): Promise<void> {
  await db.transaction().execute(async (trx) => {
    await trx
      .deleteFrom('hadith_footnotes')
      .where('hadith_id', '=', hadithId)
      .where('scope', '=', 'hadith')
      .execute()

    if (footnotes.length === 0) return

    await trx
      .insertInto('hadith_footnotes')
      .values(
        footnotes.map((f) => ({
          hadith_id: hadithId,
          scope: 'hadith' as const,
          type: f.type,
          base_type: baseTypeOf(f.type),
          language: f.language,
          position: f.position,
          number: f.number,
          hadith_index: f.hadith_index ?? 0,
          content: f.content,
        }))
      )
      .execute()
  })
}

export async function replaceChapterFootnotes(
  chapterId: string,
  footnotes: FootnoteInput[]
): Promise<void> {
  await db.transaction().execute(async (trx) => {
    await trx
      .deleteFrom('chapter_footnotes')
      .where('chapter_id', '=', chapterId)
      .execute()

    if (footnotes.length === 0) return

    await trx
      .insertInto('chapter_footnotes')
      .values(
        footnotes.map((f) => ({
          chapter_id: chapterId,
          type: f.type,
          base_type: baseTypeOf(f.type),
          language: f.language,
          position: f.position,
          number: f.number,
          hadith_index: f.hadith_index,
          content: f.content,
        }))
      )
      .execute()
  })
}

export async function replaceVolumeFootnotes(
  volumeId: string,
  footnotes: FootnoteInput[]
): Promise<void> {
  await db.transaction().execute(async (trx) => {
    await trx
      .deleteFrom('volume_footnotes')
      .where('volume_id', '=', volumeId)
      .execute()

    if (footnotes.length === 0) return

    await trx
      .insertInto('volume_footnotes')
      .values(
        footnotes.map((f) => ({
          volume_id: volumeId,
          type: f.type,
          base_type: baseTypeOf(f.type),
          language: f.language,
          position: f.position,
          number: f.number,
          hadith_index: f.hadith_index,
          content: f.content,
        }))
      )
      .execute()
  })
}
