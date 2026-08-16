import { sql } from 'kysely'
import { db } from '@/lib/db'
import type { Volume, VolumeWithBookSlug } from '@/lib/types/hadith'

type VolumeRow = {
  id: string
  mongo_id: string | null
  book_id: string
  number: number | null
  slug: string
  title_ms: string | null
  title_ar: string | null
  title_en: string | null
  metadata_ms: string | null
  metadata_ar: string | null
  metadata_en: string | null
  transliteration_ms: string | null
  transliteration_en: string | null
  hadith_first: number | null
  hadith_last: number | null
  created_at?: string
  updated_at?: string
}

const rowToVolume = (r: VolumeRow): Volume => ({
  id: r.id,
  mongo_id: r.mongo_id ?? null,
  book_id: r.book_id,
  number: Number(r.number),
  slug: r.slug,
  title_ms: r.title_ms ?? '',
  title_ar: r.title_ar ?? '',
  title_en: r.title_en ?? '',
  metadata_ms: r.metadata_ms ?? '',
  metadata_ar: r.metadata_ar ?? '',
  metadata_en: r.metadata_en ?? '',
  transliteration_ms: r.transliteration_ms ?? '',
  transliteration_en: r.transliteration_en ?? '',
  hadith_first: r.hadith_first != null ? Number(r.hadith_first) : null,
  hadith_last: r.hadith_last != null ? Number(r.hadith_last) : null,
  created_at: r.created_at,
  updated_at: r.updated_at,
})

export async function getVolumeBySlug(
  bookSlug: string,
  volumeSlug: string
): Promise<Volume | null> {
  const row = await db
    .selectFrom('volumes as v')
    .innerJoin('books as b', 'v.book_id', 'b.id')
    .selectAll('v')
    .where('b.slug', '=', bookSlug)
    .where('v.slug', '=', volumeSlug)
    .orderBy('v.number', 'asc')
    .limit(1)
    .executeTakeFirst()
  return row ? rowToVolume(row) : null
}

// Fetch a single volume by id and enrich it with extra_numbers (hadiths whose
// number falls outside the volume's [hadith_first, hadith_last] range) and
// variant_anchors (the first variant letter per shared number). Backs the
// volume detail route.
export async function getVolumeById(volumeId: string): Promise<Volume | null> {
  const [row, extraRows, variantRows] = await Promise.all([
    db
      .selectFrom('volumes')
      .selectAll()
      .where('id', '=', volumeId)
      .limit(1)
      .executeTakeFirst(),
    db
      .selectFrom('hadiths as h')
      .innerJoin('volumes as v', 'v.id', 'h.volume_id')
      .select('h.number as num')
      .distinct()
      .where('h.volume_id', '=', volumeId)
      .where('v.hadith_first', 'is not', null)
      .where('v.hadith_last', 'is not', null)
      .where((eb) =>
        eb.or([
          eb('h.number', '<', eb.ref('v.hadith_first')),
          eb('h.number', '>', eb.ref('v.hadith_last')),
        ])
      )
      .execute(),
    db
      .selectFrom('hadiths')
      .select(({ fn }) => [
        'number',
        fn.min('variant').as('first_variant'),
      ])
      .where('volume_id', '=', volumeId)
      .where('variant', 'is not', null)
      .groupBy('number')
      .execute(),
  ])

  if (!row) return null

  const extra_numbers = extraRows.map((r) => Number(r.num))
  const variant_anchors: Record<number, string> = {}
  for (const r of variantRows) {
    if (r.first_variant != null) {
      variant_anchors[Number(r.number)] = r.first_variant
    }
  }

  return {
    ...rowToVolume(row),
    extra_numbers,
    variant_anchors,
  }
}

export async function getVolumeByIdAndBookId(
  volumeId: string,
  bookId: string
): Promise<Volume | null> {
  const row = await db
    .selectFrom('volumes')
    .selectAll()
    .where('id', '=', volumeId)
    .where('book_id', '=', bookId)
    .limit(1)
    .executeTakeFirst()
  return row ? rowToVolume(row) : null
}

export async function getVolumeByBookSlugAndNumber(
  bookSlug: string,
  number: number
): Promise<Volume | null> {
  const row = await db
    .selectFrom('volumes as v')
    .innerJoin('books as b', 'v.book_id', 'b.id')
    .selectAll('v')
    .where('b.slug', '=', bookSlug)
    .where('v.number', '=', number)
    .limit(1)
    .executeTakeFirst()
  return row ? rowToVolume(row) : null
}

type BookScope =
  | { type: 'bookSlug'; value: string }
  | { type: 'bookId'; value: string }

async function fetchExtrasByVolume(
  scope: BookScope
): Promise<Map<string, number[]>> {
  // Inner: distinct hadith numbers that fall outside their volume's [first, last] range.
  // Outer: aggregate per volume into a JSON array via json_group_array.
  const inner = db
    .selectFrom('hadiths as h')
    .innerJoin('volumes as v', 'v.id', 'h.volume_id')
    .$if(scope.type === 'bookSlug', (qb) =>
      qb
        .innerJoin('books as b', 'b.id', 'v.book_id')
        .where('b.slug', '=', scope.value)
    )
    .$if(scope.type === 'bookId', (qb) =>
      qb.where('v.book_id', '=', scope.value)
    )
    .where('v.hadith_first', 'is not', null)
    .where('v.hadith_last', 'is not', null)
    .where((eb) =>
      eb.or([
        eb('h.number', '<', eb.ref('v.hadith_first')),
        eb('h.number', '>', eb.ref('v.hadith_last')),
      ])
    )
    .select(['h.volume_id', 'h.number as num'])
    .distinct()

  const rows = await db
    .selectFrom(inner.as('x'))
    .select([
      'x.volume_id',
      sql<string>`json_group_array(x.num)`.as('nums'),
    ])
    .groupBy('x.volume_id')
    .execute()

  return new Map(
    rows.map((r) => [r.volume_id, JSON.parse(r.nums) as number[]])
  )
}

async function fetchVariantsByVolume(
  scope: BookScope
): Promise<Map<string, Record<number, string>>> {
  const rows = await db
    .selectFrom('hadiths as h')
    .$if(scope.type === 'bookSlug', (qb) =>
      qb
        .innerJoin('books as b', 'b.id', 'h.book_id')
        .where('b.slug', '=', scope.value)
    )
    .$if(scope.type === 'bookId', (qb) =>
      qb.where('h.book_id', '=', scope.value)
    )
    .where('h.variant', 'is not', null)
    .select(({ fn }) => [
      'h.volume_id',
      'h.number',
      fn.min('h.variant').as('first_variant'),
    ])
    .groupBy(['h.volume_id', 'h.number'])
    .execute()

  const byVolume = new Map<string, Record<number, string>>()
  for (const r of rows) {
    const m = byVolume.get(r.volume_id) ?? {}
    m[Number(r.number)] = r.first_variant as string
    byVolume.set(r.volume_id, m)
  }
  return byVolume
}

async function enrichWithExtrasAndVariants(
  volumes: VolumeRow[],
  scope: BookScope
): Promise<Volume[]> {
  const [extras, variants] = await Promise.all([
    fetchExtrasByVolume(scope),
    fetchVariantsByVolume(scope),
  ])

  return volumes.map((r) => ({
    ...rowToVolume(r),
    extra_numbers: extras.get(r.id) ?? [],
    variant_anchors: variants.get(r.id) ?? {},
  }))
}

export async function getVolumesByBookSlug(
  bookSlug: string
): Promise<Volume[]> {
  const rows = await db
    .selectFrom('volumes as v')
    .innerJoin('books as b', 'v.book_id', 'b.id')
    .selectAll('v')
    .where('b.slug', '=', bookSlug)
    .orderBy('v.number', 'asc')
    .execute()
  return enrichWithExtrasAndVariants(rows, {
    type: 'bookSlug',
    value: bookSlug,
  })
}

export async function getVolumesByBookId(bookId: string): Promise<Volume[]> {
  const rows = await db
    .selectFrom('volumes')
    .selectAll()
    .where('book_id', '=', bookId)
    .orderBy('number', 'asc')
    .execute()
  return enrichWithExtrasAndVariants(rows, { type: 'bookId', value: bookId })
}

export async function getAllVolumes(): Promise<VolumeWithBookSlug[]> {
  const rows = await db
    .selectFrom('volumes as v')
    .innerJoin('books as b', 'v.book_id', 'b.id')
    .selectAll('v')
    .select('b.slug as book_slug')
    .orderBy('b.id')
    .orderBy('v.number')
    .execute()
  return rows.map((r) => ({
    ...rowToVolume(r),
    book_slug: r.book_slug,
  }))
}

