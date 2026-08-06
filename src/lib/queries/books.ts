import { db } from '@/lib/db'
import type { Book } from '@/lib/types/hadith'

export type BookWithStats = Book & {
  last_volume_number: number | null
  total_hadiths: number | null
}

type BookRow = {
  id: string
  mongo_id: string | null
  slug: string
  name: string
  title_ms: string | null
  title_ar: string | null
  title_en: string | null
  created_at?: string
  updated_at?: string
}

const rowToBook = (r: BookRow): Book => ({
  id: r.id,
  mongo_id: r.mongo_id ?? null,
  slug: r.slug,
  name: r.name,
  title_ms: r.title_ms ?? '',
  title_ar: r.title_ar ?? '',
  title_en: r.title_en ?? '',
  created_at: r.created_at,
  updated_at: r.updated_at,
})

export async function getAllBooks(): Promise<Book[]> {
  const rows = await db
    .selectFrom('books')
    .selectAll()
    .orderBy('mongo_id', 'asc')
    .execute()
  return rows.map(rowToBook)
}

export async function getBookBySlug(slug: string): Promise<Book | null> {
  const row = await db
    .selectFrom('books')
    .selectAll()
    .where('slug', '=', slug)
    .limit(1)
    .executeTakeFirst()
  return row ? rowToBook(row) : null
}

export async function getBookById(id: string): Promise<Book | null> {
  const row = await db
    .selectFrom('books')
    .selectAll()
    .where('id', '=', id)
    .limit(1)
    .executeTakeFirst()
  return row ? rowToBook(row) : null
}

export async function getBookIdBySlug(slug: string): Promise<string | null> {
  const row = await db
    .selectFrom('books')
    .select('id')
    .where('slug', '=', slug)
    .limit(1)
    .executeTakeFirst()
  return row?.id ?? null
}

export async function getBooksWithStats(): Promise<BookWithStats[]> {
  const rows = await db
    .selectFrom('books as b')
    .selectAll('b')
    .select((eb) => [
      eb
        .selectFrom('volumes')
        .select(({ fn }) => fn.max('number').as('last_volume_number'))
        .whereRef('volumes.book_id', '=', 'b.id')
        .as('last_volume_number'),
      eb
        .selectFrom('volumes')
        .select('hadith_last')
        .whereRef('volumes.book_id', '=', 'b.id')
        .orderBy('number', 'desc')
        .limit(1)
        .as('total_hadiths'),
    ])
    .orderBy('b.mongo_id', 'asc')
    .execute()

  return rows.map((r) => ({
    ...rowToBook(r),
    last_volume_number:
      r.last_volume_number != null ? Number(r.last_volume_number) : null,
    total_hadiths: r.total_hadiths != null ? Number(r.total_hadiths) : null,
  }))
}
