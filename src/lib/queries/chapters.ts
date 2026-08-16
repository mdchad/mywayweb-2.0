import { sql } from 'kysely'
import { db } from '@/lib/db'
import type { Chapter } from '@/lib/types/hadith'

// Raw chapter row from the DB (snake_case columns).
export type ChapterRow = {
  id: string
  volume_id: string
  book_id: string
  number: number | null
  hadith_first: number | null
  hadith_last: number | null
  title_ar: string | null
  title_ms: string | null
  title_en: string | null
  name: string | null
  transliteration_ms: string | null
  transliteration_en: string | null
  metadata_ar: string | null
  metadata_ms: string | null
  metadata_en: string | null
  lexicalState: string | null
}

// Canonical Chapter domain shape, with hadith_first/last preserved for views
// that need to expose the chapter's hadith range alongside its core fields.
export type ChapterWithRange = Chapter & {
  hadith_first: number | null
  hadith_last: number | null
}

export const rowToChapter = (r: ChapterRow): ChapterWithRange => ({
  id: r.id,
  name: r.name ?? '',
  number: r.number != null ? Number(r.number) : null,
  title_ms: r.title_ms ?? '',
  title_ar: r.title_ar ?? '',
  title_en: r.title_en ?? '',
  metadata_ms: r.metadata_ms ?? '',
  metadata_ar: r.metadata_ar ?? '',
  metadata_en: r.metadata_en ?? '',
  transliteration_ms: r.transliteration_ms ?? '',
  transliteration_en: r.transliteration_en ?? '',
  lexicalState: r.lexicalState ? JSON.parse(r.lexicalState) : null,
  hadith_first: r.hadith_first != null ? Number(r.hadith_first) : null,
  hadith_last: r.hadith_last != null ? Number(r.hadith_last) : null,
})

// Full chapter row + parent FK ids + updated_at, used by the admin edit page.
// FK ids are kept so the form can show navigation breadcrumbs back to the
// volume/book. updated_at is used as an ETag for optimistic concurrency.
export type ChapterRecord = ChapterWithRange & {
  volume_id: string
  book_id: string
  updated_at: string | null
}

export async function getChapterById(
  id: string
): Promise<ChapterRecord | null> {
  const row = await db
    .selectFrom('chapters')
    .select([
      'id',
      'volume_id',
      'book_id',
      'number',
      'hadith_first',
      'hadith_last',
      'title_ar',
      'title_ms',
      'title_en',
      'name',
      'transliteration_ms',
      'transliteration_en',
      'metadata_ar',
      'metadata_ms',
      'metadata_en',
      'lexicalState',
      'updated_at',
    ])
    .where('id', '=', id)
    .limit(1)
    .executeTakeFirst()
  if (!row) return null
  return {
    ...rowToChapter(row),
    volume_id: row.volume_id,
    book_id: row.book_id,
    updated_at: row.updated_at ?? null,
  }
}

export async function getChaptersForVolume(
  volumeId: string
): Promise<ChapterWithRange[]> {
  const rows = await db
    .selectFrom('chapters')
    .select([
      'id',
      'volume_id',
      'book_id',
      'number',
      'hadith_first',
      'hadith_last',
      'title_ar',
      'title_ms',
      'title_en',
      'name',
      'transliteration_ms',
      'transliteration_en',
      'metadata_ar',
      'metadata_ms',
      'metadata_en',
      'lexicalState',
    ])
    .where('volume_id', '=', volumeId)
    .orderBy('number', 'asc')
    .execute()
  return rows.map(rowToChapter)
}

// Used by the admin form's "set chapter as previous" flow. Given the current
// hadith id, finds the chapter immediately before it in canonical reading
// order within the same volume: composite `(chapter.number, hadith.sort_order)`,
// so variant siblings (same number) are walked correctly.
export async function getPreviousChapterForHadith(
  currentHadithId: string
): Promise<ChapterWithRange | null> {
  // First locate the current hadith's anchor (volume, chapter.number, sort_order).
  const cur = await db
    .selectFrom('hadiths as h')
    .innerJoin('chapters as c', 'c.id', 'h.chapter_id')
    .select([
      'h.volume_id',
      'c.number as c_num',
      'h.sort_order',
    ])
    .where('h.id', '=', currentHadithId)
    .executeTakeFirst()
  if (!cur || cur.c_num == null) return null

  const row = await db
    .selectFrom('hadiths as h')
    .innerJoin('chapters as c', 'c.id', 'h.chapter_id')
    .select([
      'c.id',
      'c.volume_id',
      'c.book_id',
      'c.number',
      'c.hadith_first',
      'c.hadith_last',
      'c.title_ar',
      'c.title_ms',
      'c.title_en',
      'c.name',
      'c.transliteration_ms',
      'c.transliteration_en',
      'c.metadata_ar',
      'c.metadata_ms',
      'c.metadata_en',
      'c.lexicalState',
    ])
    .where('h.volume_id', '=', cur.volume_id)
    .where((eb) =>
      eb.or([
        eb('c.number', '<', cur.c_num as number),
        eb.and([
          eb('c.number', '=', cur.c_num as number),
          eb('h.sort_order', '<', cur.sort_order),
        ]),
      ])
    )
    .orderBy('c.number', 'desc')
    .orderBy('h.sort_order', 'desc')
    .limit(1)
    .executeTakeFirst()
  return row ? rowToChapter(row) : null
}

// Read just the `lexicalState` JSON blob for a chapter. Used by the admin PUT
// flow to merge incoming changes into the existing blob before writing back.
export async function getChapterLexicalState(
  chapterId: string
): Promise<Record<string, unknown>> {
  const row = await db
    .selectFrom('chapters')
    .select('lexicalState')
    .where('id', '=', chapterId)
    .limit(1)
    .executeTakeFirst()
  if (!row?.lexicalState) return {}
  try {
    return JSON.parse(row.lexicalState) as Record<string, unknown>
  } catch {
    return {}
  }
}

export async function updateChapterLexicalState(
  chapterId: string,
  lex: Record<string, unknown>
): Promise<void> {
  await db
    .updateTable('chapters')
    .set({ lexicalState: JSON.stringify(lex), updated_at: sql`CURRENT_TIMESTAMP` })
    .where('id', '=', chapterId)
    .execute()
}

// Apply a freeform column update to one or more chapter columns.
// Used by the admin hadith PUT flow when the form edits chapter-scoped fields
// (title_ms, metadata_ar, etc.). The caller is responsible for whitelisting
// the column names against an allowed set.
export async function updateChapterFields(
  chapterId: string,
  fields: Record<string, unknown>
): Promise<void> {
  if (Object.keys(fields).length === 0) return
  await db
    .updateTable('chapters')
    .set({ ...fields, updated_at: sql`CURRENT_TIMESTAMP` })
    .where('id', '=', chapterId)
    .execute()
}

// Columns the new chapter PUT endpoint is allowed to write directly.
export const CHAPTER_EDITABLE_COLUMNS = [
  'title_ar',
  'title_ms',
  'title_en',
  'metadata_ar',
  'metadata_ms',
  'metadata_en',
  'transliteration_ms',
  'transliteration_en',
  'name',
  'number',
] as const

export type ChapterEditableColumn = (typeof CHAPTER_EDITABLE_COLUMNS)[number]

export type ChapterUpdateInput = {
  // Plain text columns the form edits directly.
  fields?: Partial<Record<ChapterEditableColumn, string | number | null>>
  // Per-field, per-language lexical editor state. Merged into the existing
  // lexicalState blob (keys like "metadata_ms", "metadata_ar", ...).
  lexicalState?: Record<string, unknown>
}

export type ChapterUpdateResult = {
  before: ChapterRecord
  after: ChapterRecord
}

// Update a chapter atomically:
//   1. Read current row (inside transaction) — used as `before` for audit and
//      as the base for the lexicalState merge.
//   2. Optional ETag check: if `expectedUpdatedAt` is supplied and doesn't match
//      the current row's updated_at, throw a ChapterUpdateConflict so the
//      route can return 412.
//   3. Merge incoming lexicalState into the existing blob.
//   4. Write fields + merged lex + CURRENT_TIMESTAMP.
//   5. Read the row back as `after`.
export class ChapterUpdateConflict extends Error {
  constructor(message = 'Chapter has been modified since you loaded it.') {
    super(message)
    this.name = 'ChapterUpdateConflict'
  }
}

export async function updateChapter(
  id: string,
  input: ChapterUpdateInput,
  expectedUpdatedAt?: string | null
): Promise<ChapterUpdateResult | null> {
  return await db.transaction().execute(async (trx): Promise<ChapterUpdateResult | null> => {
    const beforeRow = await trx
      .selectFrom('chapters')
      .select([
        'id',
        'volume_id',
        'book_id',
        'number',
        'hadith_first',
        'hadith_last',
        'title_ar',
        'title_ms',
        'title_en',
        'name',
        'transliteration_ms',
        'transliteration_en',
        'metadata_ar',
        'metadata_ms',
        'metadata_en',
        'lexicalState',
        'updated_at',
      ])
      .where('id', '=', id)
      .limit(1)
      .executeTakeFirst()
    if (!beforeRow) return null

    if (
      expectedUpdatedAt != null &&
      (beforeRow.updated_at ?? null) !== expectedUpdatedAt
    ) {
      throw new ChapterUpdateConflict()
    }

    const fieldsEntries = Object.entries(input.fields ?? {}).filter(
      ([, v]) => v !== undefined
    )

    let mergedLex: Record<string, unknown> | null = null
    if (input.lexicalState && Object.keys(input.lexicalState).length > 0) {
      const currentLex: Record<string, unknown> = (() => {
        if (!beforeRow.lexicalState) return {}
        try {
          return JSON.parse(beforeRow.lexicalState) as Record<string, unknown>
        } catch {
          return {}
        }
      })()
      mergedLex = { ...currentLex, ...input.lexicalState }
    }

    if (fieldsEntries.length === 0 && mergedLex == null) {
      // Nothing to write; return current row as both before and after.
      const same: ChapterRecord = {
        ...rowToChapter(beforeRow),
        volume_id: beforeRow.volume_id,
        book_id: beforeRow.book_id,
        updated_at: beforeRow.updated_at ?? null,
      }
      return { before: same, after: same }
    }

    const updateSet: Record<string, unknown> = {
      ...Object.fromEntries(fieldsEntries),
      updated_at: sql`CURRENT_TIMESTAMP`,
    }
    if (mergedLex != null) {
      updateSet.lexicalState = JSON.stringify(mergedLex)
    }

    await trx
      .updateTable('chapters')
      .set(updateSet)
      .where('id', '=', id)
      .execute()

    const afterRow = await trx
      .selectFrom('chapters')
      .select([
        'id',
        'volume_id',
        'book_id',
        'number',
        'hadith_first',
        'hadith_last',
        'title_ar',
        'title_ms',
        'title_en',
        'name',
        'transliteration_ms',
        'transliteration_en',
        'metadata_ar',
        'metadata_ms',
        'metadata_en',
        'lexicalState',
        'updated_at',
      ])
      .where('id', '=', id)
      .limit(1)
      .executeTakeFirstOrThrow()

    return {
      before: {
        ...rowToChapter(beforeRow),
        volume_id: beforeRow.volume_id,
        book_id: beforeRow.book_id,
        updated_at: beforeRow.updated_at ?? null,
      },
      after: {
        ...rowToChapter(afterRow),
        volume_id: afterRow.volume_id,
        book_id: afterRow.book_id,
        updated_at: afterRow.updated_at ?? null,
      },
    }
  })
}
