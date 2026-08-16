import { sql } from 'kysely'
import { db } from '@/lib/db'
import type {
  Hadith,
  HadithAdmin,
  HadithPreview,
  HadithFootnotes,
  Footnote,
} from '@/lib/types/hadith'
import { labelOf } from '@/lib/types/hadith'

// Composable SELECT fragment: hadith + canonical book/volume/chapter via joins.
// Reused across every "fetch a hadith with its parents" query in this file.
const selectHadithWithJoins = () =>
  db
    .selectFrom('hadiths as h')
    .innerJoin('books as b', 'h.book_id', 'b.id')
    .innerJoin('volumes as v', 'h.volume_id', 'v.id')
    .leftJoin('chapters as c', 'h.chapter_id', 'c.id')
    .select([
      'h.id',
      'h.number',
      'h.variant',
      'h.sort_order',
      'h.mongo_id',
      'h.volume_id',
      'h.book_id',
      'h.chapter_id',
      'h.content',
      'h.audio_files',
      'h.lexicalState as hadith_lexical_state',
      // canonical book
      'b.id as book_id_canon',
      'b.mongo_id as book_mongo_id',
      'b.slug as book_slug',
      'b.name as book_name',
      'b.title_ms as book_title_ms',
      'b.title_ar as book_title_ar',
      'b.title_en as book_title_en',
      // canonical volume
      'v.id as volume_id_canon',
      'v.mongo_id as volume_mongo_id',
      'v.number as volume_number',
      'v.slug as volume_slug',
      'v.title_ms as volume_title_ms',
      'v.title_ar as volume_title_ar',
      'v.title_en as volume_title_en',
      'v.metadata_ms as volume_metadata_ms',
      'v.metadata_ar as volume_metadata_ar',
      'v.metadata_en as volume_metadata_en',
      'v.transliteration_ms as volume_transliteration_ms',
      'v.transliteration_en as volume_transliteration_en',
      'v.hadith_first as volume_hadith_first',
      'v.hadith_last as volume_hadith_last',
      // canonical chapter
      'c.id as chapter_id_canon',
      'c.name as chapter_name',
      'c.number as chapter_number',
      'c.title_ms as chapter_title_ms',
      'c.title_ar as chapter_title_ar',
      'c.title_en as chapter_title_en',
      'c.metadata_ms as chapter_metadata_ms',
      'c.metadata_ar as chapter_metadata_ar',
      'c.metadata_en as chapter_metadata_en',
      'c.transliteration_ms as chapter_transliteration_ms',
      'c.transliteration_en as chapter_transliteration_en',
      'c.lexicalState as chapter_lexical_state',
    ])

type HadithJoinedRow = Awaited<
  ReturnType<ReturnType<typeof selectHadithWithJoins>['execute']>
>[number]

const rowToHadith = (r: HadithJoinedRow): Hadith => {
  const number = Number(r.number)
  const variant = (r.variant ?? null) as string | null
  return {
    id: r.id,
    number,
    variant,
    label: labelOf(number, variant),
    sort_order: r.sort_order != null ? Number(r.sort_order) : null,
    mongo_id: r.mongo_id,
    content: JSON.parse(r.content || '[]'),
    audio_files: JSON.parse(r.audio_files || '{}'),
    lexicalState: r.hadith_lexical_state
      ? JSON.parse(r.hadith_lexical_state)
      : null,
    book_id: r.book_id,
    volume_id: r.volume_id,
    chapter_id: r.chapter_id ?? null,
    book: {
      id: r.book_id_canon ?? r.book_id,
      mongo_id: r.book_mongo_id ?? null,
      slug: r.book_slug ?? '',
      name: r.book_name ?? '',
      title_ms: r.book_title_ms ?? '',
      title_ar: r.book_title_ar ?? '',
      title_en: r.book_title_en ?? '',
    },
    volume: {
      id: r.volume_id_canon ?? r.volume_id,
      mongo_id: r.volume_mongo_id ?? null,
      book_id: r.book_id,
      number: r.volume_number != null ? Number(r.volume_number) : 0,
      slug: r.volume_slug ?? '',
      title_ms: r.volume_title_ms ?? '',
      title_ar: r.volume_title_ar ?? '',
      title_en: r.volume_title_en ?? '',
      metadata_ms: r.volume_metadata_ms ?? '',
      metadata_ar: r.volume_metadata_ar ?? '',
      metadata_en: r.volume_metadata_en ?? '',
      transliteration_ms: r.volume_transliteration_ms ?? '',
      transliteration_en: r.volume_transliteration_en ?? '',
      hadith_first:
        r.volume_hadith_first != null ? Number(r.volume_hadith_first) : null,
      hadith_last:
        r.volume_hadith_last != null ? Number(r.volume_hadith_last) : null,
    },
    chapter: r.chapter_id_canon
      ? {
          id: r.chapter_id_canon,
          name: r.chapter_name ?? '',
          number: r.chapter_number != null ? Number(r.chapter_number) : null,
          title_ms: r.chapter_title_ms ?? '',
          title_ar: r.chapter_title_ar ?? '',
          title_en: r.chapter_title_en ?? '',
          metadata_ms: r.chapter_metadata_ms ?? '',
          metadata_ar: r.chapter_metadata_ar ?? '',
          metadata_en: r.chapter_metadata_en ?? '',
          transliteration_ms: r.chapter_transliteration_ms ?? '',
          transliteration_en: r.chapter_transliteration_en ?? '',
          lexicalState: r.chapter_lexical_state
            ? JSON.parse(r.chapter_lexical_state)
            : null,
        }
      : null,
  }
}

type FootnoteSourceRow = {
  id: number
  type: string
  base_type: string | null
  language: 'ar' | 'ms' | 'en' | null
  position: number
  number: number
  hadith_index: number | null
  content: string
}

const footnoteRow =
  (scope: 'hadith' | 'chapter' | 'volume') =>
  (r: FootnoteSourceRow): Footnote => ({
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

export async function getRandomHadith(): Promise<Hadith | null> {
  const r = await selectHadithWithJoins()
    .where(sql`json_extract(h.content, '$[0].ms')`, '!=', '')
    .orderBy(sql`RANDOM()`)
    .limit(1)
    .executeTakeFirst()
  return r ? rowToHadith(r) : null
}

export async function getRandomHadithPreview(): Promise<HadithPreview | null> {
  const h = await getRandomHadith()
  if (!h) return null
  return hadithToPreview(h)
}

// Shape adapters moved to lib/queries/hadith-shapes.ts (pure module, no DB
// imports). Re-exported here so existing call sites keep working.
import { hadithToPreview } from './hadith-shapes'
export { hadithToPreview } from './hadith-shapes'

export async function getHadithById(id: string): Promise<Hadith | null> {
  const r = await selectHadithWithJoins()
    .where('h.id', '=', id)
    .limit(1)
    .executeTakeFirst()
  return r ? rowToHadith(r) : null
}

const FOOTNOTE_SELECT = [
  'id',
  'type',
  'base_type',
  'language',
  'position',
  'number',
  'hadith_index',
  'content',
] as const

async function getFootnotesForHadith(
  hadith: Hadith
): Promise<HadithFootnotes> {
  const [hadithRows, chapterRows, volumeRows] = await Promise.all([
    db
      .selectFrom('hadith_footnotes')
      .select(FOOTNOTE_SELECT)
      .where('hadith_id', '=', hadith.id)
      .where('scope', '=', 'hadith')
      .orderBy('number')
      .execute(),
    hadith.chapter_id
      ? db
          .selectFrom('chapter_footnotes')
          .select(FOOTNOTE_SELECT)
          .where('chapter_id', '=', hadith.chapter_id)
          .orderBy('number')
          .execute()
      : Promise.resolve([] as FootnoteSourceRow[]),
    db
      .selectFrom('volume_footnotes')
      .select(FOOTNOTE_SELECT)
      .where('volume_id', '=', hadith.volume_id)
      .orderBy('number')
      .execute(),
  ])

  return {
    hadith: hadithRows.map(footnoteRow('hadith')),
    chapter: chapterRows.map(footnoteRow('chapter')),
    volume: volumeRows.map(footnoteRow('volume')),
  }
}

export async function getHadithAdminById(
  id: string
): Promise<HadithAdmin | null> {
  const r = await selectHadithWithJoins()
    .select('h.processed as hadith_processed')
    .where('h.id', '=', id)
    .limit(1)
    .executeTakeFirst()
  if (!r) return null
  const base = rowToHadith(r)
  const footnotes = await getFootnotesForHadith(base)
  return {
    ...base,
    footnotes,
    processed: !!r.hadith_processed,
  }
}

// Lightweight hadith row scoped to one volume. Used by the volume view (page
// + API) where each hadith is rendered inside its chapter. Footnotes are
// fetched separately via getHadithFootnotesByVolumeId and merged on the JS
// side.
export type HadithVolumeRow = {
  id: string
  number: number
  variant: string | null
  sort_order: number | null
  mongo_id: string
  volume_id: string
  book_id: string
  chapter_id: string | null
  content: string
  lexicalState: string | null
  audio_files: string | null
}

const HADITH_VOLUME_COLUMNS = [
  'h.id',
  'h.number',
  'h.variant',
  'h.sort_order',
  'h.mongo_id',
  'h.volume_id',
  'h.book_id',
  'h.chapter_id',
  'h.content',
  'h.lexicalState',
  'h.audio_files',
] as const

export async function getHadithsForVolume(
  volumeId: string,
  opts?: { limit?: number; offset?: number; sortByChapterThenOrder?: boolean }
): Promise<HadithVolumeRow[]> {
  if (opts?.sortByChapterThenOrder) {
    let q = db
      .selectFrom('hadiths as h')
      .leftJoin('chapters as c', 'c.id', 'h.chapter_id')
      .select(HADITH_VOLUME_COLUMNS)
      .where('h.volume_id', '=', volumeId)
      .orderBy('c.number', 'asc')
      .orderBy('h.sort_order', 'asc')
    if (opts?.limit != null) q = q.limit(opts.limit)
    if (opts?.offset != null) q = q.offset(opts.offset)
    return await q.execute()
  }

  let q = db
    .selectFrom('hadiths as h')
    .select(HADITH_VOLUME_COLUMNS)
    .where('h.volume_id', '=', volumeId)
    .orderBy('h.sort_order', 'asc')
  if (opts?.limit != null) q = q.limit(opts.limit)
  if (opts?.offset != null) q = q.offset(opts.offset)
  return await q.execute()
}

export async function getHadithCountForVolume(
  volumeId: string
): Promise<number> {
  const row = await db
    .selectFrom('hadiths')
    .select(({ fn }) => fn.countAll().as('count'))
    .where('volume_id', '=', volumeId)
    .executeTakeFirst()
  return Number(row?.count ?? 0)
}

// Fetch the canonical parent ids (chapter_id, volume_id) for a hadith.
// Used by the admin PUT flow before applying the edit plan.
export async function getHadithParentIds(
  hadithId: string
): Promise<{ chapter_id: string | null; volume_id: string | null } | null> {
  const row = await db
    .selectFrom('hadiths')
    .select(['chapter_id', 'volume_id'])
    .where('id', '=', hadithId)
    .limit(1)
    .executeTakeFirst()
  if (!row) return null
  return {
    chapter_id: row.chapter_id ?? null,
    volume_id: row.volume_id ?? null,
  }
}

export async function findFirstVariantForNumber(
  bookSlug: string,
  number: string
): Promise<string | null> {
  const row = await db
    .selectFrom('hadiths as h')
    .innerJoin('books as b', 'b.id', 'h.book_id')
    .select('h.variant')
    .where('b.slug', '=', bookSlug)
    .where('h.number', '=', Number(number))
    .where('h.variant', 'is not', null)
    .orderBy('h.variant', 'asc')
    .limit(1)
    .executeTakeFirst()
  return row?.variant ?? null
}

// Fetch one hadith by (book_slug, number, variant) with its parents joined in.
// Variant is matched on `COALESCE(variant, '')` so a null variant in the row
// matches a null/empty variant in the request.
export async function getHadithByBookSlugAndRef(
  bookSlug: string,
  number: string,
  variant: string | null
): Promise<
  | (Hadith & {
      hadith_created_at?: string
      volume_updated_at?: string
    })
  | null
> {
  const r = await selectHadithWithJoins()
    .select([
      'h.created_at as hadith_created_at',
      'v.updated_at as volume_updated_at',
    ])
    .innerJoin('books as b2', 'b2.id', 'h.book_id')
    .where('b2.slug', '=', bookSlug)
    .where('h.number', '=', Number(number))
    .where(
      sql`COALESCE(h.variant, '')`,
      '=',
      variant ?? ''
    )
    .limit(1)
    .executeTakeFirst()
  if (!r) return null
  const base = rowToHadith(r)
  return {
    ...base,
    hadith_created_at: r.hadith_created_at ?? undefined,
    volume_updated_at: r.volume_updated_at ?? undefined,
  }
}

// Anchor row needed to compute neighbors in canonical reading order.
type NeighborAnchor = {
  book_id: string
  volume_id: string
  v_num: number
  chapter_id: string | null
  c_num: number | null
  sort_order: number | null
}

async function getNeighborAnchor(hadithId: string): Promise<NeighborAnchor | null> {
  const r = await db
    .selectFrom('hadiths as h')
    .innerJoin('volumes as v', 'v.id', 'h.volume_id')
    .leftJoin('chapters as c', 'c.id', 'h.chapter_id')
    .select([
      'h.book_id',
      'h.volume_id',
      'v.number as v_num',
      'h.chapter_id',
      'c.number as c_num',
      'h.sort_order',
    ])
    .where('h.id', '=', hadithId)
    .executeTakeFirst()
  if (!r) return null
  return {
    book_id: r.book_id,
    volume_id: r.volume_id,
    v_num: Number(r.v_num),
    chapter_id: r.chapter_id ?? null,
    c_num: r.c_num != null ? Number(r.c_num) : null,
    sort_order: r.sort_order != null ? Number(r.sort_order) : null,
  }
}

export type HadithNeighborRow = {
  number: number
  variant: string | null
}

const toNeighborRow = (
  r: { number: number | string; variant: string | null } | undefined
): HadithNeighborRow | null =>
  r
    ? { number: Number(r.number), variant: (r.variant ?? null) as string | null }
    : null

// Walk back/forward in canonical reading order (volume.number, chapter.number,
// sort_order) within the same book. Implemented as a 3-step cascade so every
// query is served by indexed seeks instead of the full-book scan the
// compound-OR predicate used to require. Steps fall through in order:
//   1. same chapter, adjacent sort_order
//   2. edge hadith of the adjacent chapter in the same volume
//   3. edge hadith of the edge chapter in the adjacent volume
// Steps 2 and 3 use chapter/volume-driven joins so empty chapters or volumes
// are skipped automatically (the join finds nothing for them; SQLite short-
// circuits to the next driver row).
async function getNeighbor(
  anchor: NeighborAnchor,
  direction: 'prev' | 'next'
): Promise<HadithNeighborRow | null> {
  const cmp = direction === 'prev' ? '<' : '>'
  const dir = direction === 'prev' ? 'desc' : 'asc'

  // Step 1: same chapter, adjacent sort_order.
  if (anchor.chapter_id && anchor.sort_order != null) {
    const r = await db
      .selectFrom('hadiths')
      .select(['number', 'variant'])
      .where('chapter_id', '=', anchor.chapter_id)
      .where('sort_order', cmp, anchor.sort_order)
      .orderBy('sort_order', dir)
      .limit(1)
      .executeTakeFirst()
    const out = toNeighborRow(r)
    if (out) return out
  }

  // Step 2: edge hadith of the adjacent non-empty chapter in the same volume.
  if (anchor.c_num != null) {
    const r = await db
      .selectFrom('chapters as c')
      .innerJoin('hadiths as h', 'h.chapter_id', 'c.id')
      .select(['h.number', 'h.variant'])
      .where('c.volume_id', '=', anchor.volume_id)
      .where('c.number', cmp, anchor.c_num)
      .orderBy('c.number', dir)
      .orderBy('h.sort_order', dir)
      .limit(1)
      .executeTakeFirst()
    const out = toNeighborRow(r)
    if (out) return out
  }

  // Step 3: edge hadith of the edge chapter in the adjacent non-empty volume.
  const r = await db
    .selectFrom('volumes as v')
    .innerJoin('chapters as c', 'c.volume_id', 'v.id')
    .innerJoin('hadiths as h', 'h.chapter_id', 'c.id')
    .select(['h.number', 'h.variant'])
    .where('v.book_id', '=', anchor.book_id)
    .where('v.number', cmp, anchor.v_num)
    .orderBy('v.number', dir)
    .orderBy('c.number', dir)
    .orderBy('h.sort_order', dir)
    .limit(1)
    .executeTakeFirst()
  return toNeighborRow(r)
}

export async function getHadithNeighbors(hadithId: string): Promise<{
  prev: HadithNeighborRow | null
  next: HadithNeighborRow | null
}> {
  const anchor = await getNeighborAnchor(hadithId)
  if (!anchor) return { prev: null, next: null }
  const [prev, next] = await Promise.all([
    getNeighbor(anchor, 'prev'),
    getNeighbor(anchor, 'next'),
  ])
  return { prev, next }
}

// "Hadis berkaitan": precomputed related hadiths from the hadith_relations
// table (built offline by scripts/build-hadith-relations.ts from embedding
// similarity). Returns enough to render a link + label + short Malay excerpt,
// ordered best-match first. Fails soft to [] if the table is missing.
export type RelatedHadith = {
  id: string
  number: number
  variant: string | null
  label: string
  relation_type: 'parallel' | 'related'
  score: number
  book: { slug: string; title_ms: string }
  excerpt_ms: string
}

const relatedExcerpt = (contentJson: string): string => {
  try {
    const parsed = JSON.parse(contentJson) as Array<{ ms?: string }>
    const ms = (parsed?.[0]?.ms ?? '').replace(/\s+/g, ' ').trim()
    return ms.length > 160 ? ms.slice(0, 160).trimEnd() + '…' : ms
  } catch {
    return ''
  }
}

export async function getRelatedHadiths(
  hadithId: string,
  limit = 8
): Promise<RelatedHadith[]> {
  try {
    const rows = await db
      .selectFrom('hadith_relations as r')
      .innerJoin('hadiths as h', 'h.id', 'r.related_id')
      .innerJoin('books as b', 'b.id', 'h.book_id')
      .select([
        'r.relation_type',
        'r.score',
        'h.id',
        'h.number',
        'h.variant',
        'h.content',
        'b.slug as book_slug',
        'b.title_ms as book_title_ms',
      ])
      .where('r.hadith_id', '=', hadithId)
      .orderBy('r.score', 'desc')
      .limit(limit)
      .execute()

    return rows.map((r) => ({
      id: r.id,
      number: r.number,
      variant: r.variant,
      label: labelOf(r.number, r.variant),
      relation_type: r.relation_type,
      score: r.score,
      book: { slug: r.book_slug, title_ms: r.book_title_ms ?? '' },
      excerpt_ms: relatedExcerpt(r.content),
    }))
  } catch (error) {
    console.error('[getRelatedHadiths] failed (table missing?):', error)
    return []
  }
}

// Apply a freeform column update to one or more `hadiths` columns. Used by the
// admin PUT flow. Caller is responsible for whitelisting allowed columns.
export async function updateHadithFields(
  hadithId: string,
  fields: Record<string, unknown>
): Promise<void> {
  if (Object.keys(fields).length === 0) return
  await db.updateTable('hadiths').set(fields).where('id', '=', hadithId).execute()
}

// Move a hadith to a new chapter and re-pin its sort_order at the end of the
// new chapter (so UNIQUE(chapter_id, sort_order) doesn't conflict with whatever
// already sits at this row's current sort_order in the target chapter).
export async function moveHadithToChapter(
  hadithId: string,
  newChapterId: string
): Promise<void> {
  await db
    .updateTable('hadiths')
    .set({
      chapter_id: newChapterId,
      sort_order: db
        .selectFrom('hadiths')
        .select(({ fn }) =>
          sql<number>`COALESCE(${fn.max('sort_order')}, 0) + 1`.as('next')
        )
        .where('chapter_id', '=', newChapterId)
        .where('id', '!=', hadithId),
    })
    .where('id', '=', hadithId)
    .execute()
}

// Run a hadith update plan inside a single transaction. API contract
// translation (dotted-path → column) lives in the route file; this function
// just executes the plan atomically. Replaces the old turso.batch flow.
export type HadithUpdatePlan = {
  // Replace chapter and re-pin sort_order at end of new chapter.
  moveToChapter?: string
  // Plain scalar columns on `hadiths`.
  scalarFields?: Record<string, unknown>
  // JSON columns on `hadiths`. For each column: list of [json_path, value].
  jsonPathEdits?: Partial<
    Record<'content' | 'lexicalState' | 'audio_files', Array<[string, unknown]>>
  >
  // Plain scalar columns on the hadith's `chapters` row.
  chapterFields?: { id: string; fields: Record<string, unknown> }
  // Plain scalar columns on the hadith's `volumes` row.
  volumeFields?: { id: string; fields: Record<string, unknown> }
}

export async function applyHadithUpdatePlan(
  hadithId: string,
  plan: HadithUpdatePlan
): Promise<void> {
  await db.transaction().execute(async (trx) => {
    if (plan.moveToChapter) {
      await trx
        .updateTable('hadiths')
        .set({
          chapter_id: plan.moveToChapter,
          sort_order: trx
            .selectFrom('hadiths')
            .select(({ fn }) =>
              sql<number>`COALESCE(${fn.max('sort_order')}, 0) + 1`.as('next')
            )
            .where('chapter_id', '=', plan.moveToChapter)
            .where('id', '!=', hadithId),
        })
        .where('id', '=', hadithId)
        .execute()
    }

    if (plan.scalarFields && Object.keys(plan.scalarFields).length > 0) {
      await trx
        .updateTable('hadiths')
        .set(plan.scalarFields)
        .where('id', '=', hadithId)
        .execute()
    }

    if (plan.jsonPathEdits) {
      for (const [col, paths] of Object.entries(plan.jsonPathEdits) as Array<
        [
          'content' | 'lexicalState' | 'audio_files',
          Array<[string, unknown]>,
        ]
      >) {
        if (!paths || paths.length === 0) continue
        // Build `json_set(IFNULL(col, '{}'), p1, json(v1), p2, json(v2), ...)`
        // as a single parameterised expression.
        const parts: ReturnType<typeof sql>[] = []
        for (const [p, v] of paths) {
          parts.push(sql`, ${p}, json(${JSON.stringify(v)})`)
        }
        await trx
          .updateTable('hadiths')
          .set({
            [col]: sql`json_set(IFNULL(${sql.ref(col)}, '{}')${sql.join(parts, sql``)})`,
          })
          .where('id', '=', hadithId)
          .execute()
      }
    }

    if (
      plan.chapterFields &&
      Object.keys(plan.chapterFields.fields).length > 0
    ) {
      await trx
        .updateTable('chapters')
        .set({
          ...plan.chapterFields.fields,
          updated_at: sql`CURRENT_TIMESTAMP`,
        })
        .where('id', '=', plan.chapterFields.id)
        .execute()
    }

    if (
      plan.volumeFields &&
      Object.keys(plan.volumeFields.fields).length > 0
    ) {
      await trx
        .updateTable('volumes')
        .set({
          ...plan.volumeFields.fields,
          updated_at: sql`CURRENT_TIMESTAMP`,
        })
        .where('id', '=', plan.volumeFields.id)
        .execute()
    }
  })
}

// Sitemap helper: stream all kutub-sittah hadiths with their book slug and a
// best-available lastmod (volume.updated_at or hadith.created_at fallback).
export type HadithSitemapRow = {
  book_slug: string
  number: number
  variant: string | null
  lastmod: string | null
}

export async function getAllHadithsForSitemap(): Promise<HadithSitemapRow[]> {
  const rows = await db
    .selectFrom('hadiths as h')
    .innerJoin('books as b', 'h.book_id', 'b.id')
    .leftJoin('volumes as v', 'h.volume_id', 'v.id')
    .select([
      'b.slug as book_slug',
      'h.number',
      'h.variant',
      sql<string | null>`COALESCE(v.updated_at, h.created_at)`.as('lastmod'),
    ])
    .orderBy('b.id', 'asc')
    .orderBy('h.number', 'asc')
    .execute()
  return rows.map((r) => ({
    book_slug: r.book_slug,
    number: Number(r.number),
    variant: r.variant ?? null,
    lastmod: r.lastmod ?? null,
  }))
}

export type AdminSidebarHadith = {
  id: string
  number: number
  variant: string | null
  label: string
  volume_id: string
  book_id: string
  chapter_id: string | null
  chapter_title_ms: string
  volume_slug: string
  volume_title_ms: string
  book_slug: string
}

export async function getAdminVolumeHadithsList(
  volumeId: string
): Promise<AdminSidebarHadith[]> {
  const rows = await db
    .selectFrom('hadiths as h')
    .leftJoin('chapters as c', 'c.id', 'h.chapter_id')
    .leftJoin('volumes as v', 'v.id', 'h.volume_id')
    .leftJoin('books as b', 'b.id', 'h.book_id')
    .select([
      'h.id',
      'h.number',
      'h.variant',
      'h.volume_id',
      'h.book_id',
      'h.chapter_id',
      'c.title_ms as c_title_ms',
      'v.slug as v_slug',
      'v.title_ms as v_title_ms',
      'b.slug as b_slug',
    ])
    .where('h.volume_id', '=', volumeId)
    .orderBy('c.number', 'asc')
    .orderBy('h.sort_order', 'asc')
    .execute()

  return rows.map((r) => {
    const number = Number(r.number)
    const variant = (r.variant ?? null) as string | null
    return {
      id: r.id,
      number,
      variant,
      label: labelOf(number, variant),
      volume_id: r.volume_id,
      book_id: r.book_id,
      chapter_id: r.chapter_id ?? null,
      chapter_title_ms: r.c_title_ms ?? '',
      volume_slug: r.v_slug ?? '',
      volume_title_ms: r.v_title_ms ?? '',
      book_slug: r.b_slug ?? '',
    }
  })
}
