import { db } from '@/lib/db'

export type SurahRow = {
  id: string
  mongo_id: string | null
  number: number
  hadith_number: number | null
  title_ar: string | null
  title_ms: string | null
  title_en: string | null
  transliteration_ms: string | null
  transliteration_en: string | null
  content: string | null // JSON-encoded array
  created_at: string
  updated_at: string
}

export async function getAllSurahs(): Promise<SurahRow[]> {
  const rows = await db
    .selectFrom('surahs')
    .selectAll()
    .orderBy('number', 'asc')
    .execute()
  return rows as SurahRow[]
}
