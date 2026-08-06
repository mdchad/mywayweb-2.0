import { db } from '@/lib/db'
import { labelOf } from '@/lib/types/hadith'

export interface Hadis40LangText {
  ms: string
  en: string
  ar: string
}

export interface Hadis40Content extends Hadis40LangText {
  audio?: { ms?: string; ar?: string }
}

export interface Hadis40 {
  number: number
  id: string
  hadith_title: Hadis40LangText
  narrators: Hadis40LangText[]
  narrated_by: Hadis40LangText[]
  content: Hadis40Content[]
  lesson: {
    items: Hadis40LangText[]
    audio?: { ms?: string }
  }
  footnotes: unknown[]
}

type Hadith40Row = {
  number: number
  id: string
  hadith_title: string
  narrators: string
  narrated_by: string
  content: string
  lesson: string
  footnotes: string | null
}

const rowToHadis40 = (r: Hadith40Row): Hadis40 => ({
  number: r.number,
  id: r.id,
  hadith_title: JSON.parse(r.hadith_title),
  narrators: JSON.parse(r.narrators),
  narrated_by: JSON.parse(r.narrated_by),
  content: JSON.parse(r.content),
  lesson: JSON.parse(r.lesson),
  footnotes: r.footnotes ? JSON.parse(r.footnotes) : [],
})

const HADITH40_COLUMNS = [
  'number',
  'id',
  'hadith_title',
  'narrators',
  'narrated_by',
  'content',
  'lesson',
  'footnotes',
] as const

export async function getAllHadis40(): Promise<Hadis40[]> {
  const rows = await db
    .selectFrom('hadith40')
    .select(HADITH40_COLUMNS)
    .orderBy('number', 'asc')
    .execute()
  return rows.map(rowToHadis40)
}

export async function getHadis40ByNumber(
  number: number
): Promise<Hadis40 | null> {
  const row = await db
    .selectFrom('hadith40')
    .select(HADITH40_COLUMNS)
    .where('number', '=', number)
    .limit(1)
    .executeTakeFirst()
  return row ? rowToHadis40(row) : null
}

export async function getHadis40Numbers(): Promise<number[]> {
  const rows = await db
    .selectFrom('hadith40')
    .select('number')
    .orderBy('number', 'asc')
    .execute()
  return rows.map((r) => r.number)
}

// --- Hadis 40 <-> corpus source links (hadith40_sources) -------------------

// One corpus source of a Nawawi hadith, with everything needed to build the
// link (`/${book_slug}/${label}`) without a further join.
export interface Hadis40Source {
  hadith40_number: number
  hadith_id: string
  is_primary: boolean
  book_slug: string
  book_title_ms: string
  label: string
}

const sourceSelect = () =>
  db
    .selectFrom('hadith40_sources as s')
    .innerJoin('hadiths as h', 'h.id', 's.hadith_id')
    .innerJoin('books as b', 'b.id', 'h.book_id')
    .select([
      's.hadith40_number',
      's.hadith_id',
      's.is_primary',
      'b.slug as book_slug',
      'b.title_ms as book_title_ms',
      'h.number as h_number',
      'h.variant as h_variant',
    ])

const rowToSource = (r: {
  hadith40_number: number
  hadith_id: string
  is_primary: 0 | 1
  book_slug: string
  book_title_ms: string
  h_number: number
  h_variant: string | null
}): Hadis40Source => ({
  hadith40_number: r.hadith40_number,
  hadith_id: r.hadith_id,
  is_primary: !!r.is_primary,
  book_slug: r.book_slug,
  book_title_ms: r.book_title_ms ?? '',
  label: labelOf(r.h_number, r.h_variant),
})

// Sources for one Nawawi hadith, primary first.
export async function getHadis40Sources(
  number: number
): Promise<Hadis40Source[]> {
  const rows = await sourceSelect()
    .where('s.hadith40_number', '=', number)
    .orderBy('s.is_primary', 'desc')
    .orderBy('b.id', 'asc')
    .execute()
  return rows.map(rowToSource)
}

// All sources keyed by Nawawi number, for the hub page (one query, no N+1).
export async function getAllHadis40Sources(): Promise<Map<number, Hadis40Source[]>> {
  const rows = await sourceSelect()
    .orderBy('s.hadith40_number', 'asc')
    .orderBy('s.is_primary', 'desc')
    .orderBy('b.id', 'asc')
    .execute()
  const map = new Map<number, Hadis40Source[]>()
  for (const r of rows) {
    const src = rowToSource(r)
    const list = map.get(src.hadith40_number)
    if (list) list.push(src)
    else map.set(src.hadith40_number, [src])
  }
  return map
}

// Reverse lookup: which Nawawi hadith(s) this corpus hadith is a source of.
// Used for the "Sebahagian Hadis 40" badge on corpus pages. Indexed on
// hadith_id. Usually 0 or 1 result. Fails soft to [] if the table is missing.
export async function getHadis40NumbersForHadith(
  hadithId: string
): Promise<number[]> {
  try {
    const rows = await db
      .selectFrom('hadith40_sources')
      .select('hadith40_number')
      .where('hadith_id', '=', hadithId)
      .orderBy('hadith40_number', 'asc')
      .execute()
    return rows.map((r) => r.hadith40_number)
  } catch (error) {
    console.error('[getHadis40NumbersForHadith] failed (table missing?):', error)
    return []
  }
}

// --- List-page shape ------------------------------------------------------

// Trimmed to what the hadis40 pages actually render (ms/ar only): no en
// translations, no footnotes. This is the shape that goes over the wire in
// the route loader, so trimming here cuts real page weight.
export interface Hadis40ListItem {
  number: number
  id: string
  hadith_title: { ms: string }
  narrators: { ms: string }[]
  narrated_by: { ms: string; ar: string }[]
  content: { ms: string; ar: string; audio?: { ms?: string; ar?: string } }[]
  lesson: { items: { ms: string }[]; audio?: { ms?: string } }
}

const toListItem = (h: Hadis40): Hadis40ListItem => ({
  number: h.number,
  id: h.id,
  hadith_title: { ms: h.hadith_title.ms },
  narrators: h.narrators.map((n) => ({ ms: n.ms })),
  narrated_by: h.narrated_by.map((n) => ({ ms: n.ms, ar: n.ar })),
  content: h.content.map((c) => ({
    ms: c.ms,
    ar: c.ar,
    ...(c.audio ? { audio: c.audio } : {}),
  })),
  lesson: {
    items: h.lesson.items.map((l) => ({ ms: l.ms })),
    ...(h.lesson.audio ? { audio: h.lesson.audio } : {}),
  },
})

export async function getAllHadis40ForList(): Promise<Hadis40ListItem[]> {
  return (await getAllHadis40()).map(toListItem)
}
