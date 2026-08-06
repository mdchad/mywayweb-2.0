import type { ColumnType, Generated } from 'kysely'

// Schema mirrors the Turso (libSQL) database for the `myway` DB.
// Source of truth: `turso db shell myway ".schema"`.
// JSON-shaped columns are stored as TEXT; queries return raw strings and
// callers (lib/queries/*.ts) JSON.parse them.

type SqliteDate = ColumnType<string, string | undefined, string>
type SqliteBool = ColumnType<0 | 1, 0 | 1 | boolean | undefined, 0 | 1 | boolean>

export interface BooksTable {
  id: string
  mongo_id: string | null
  slug: string
  name: string
  title_ms: string
  title_ar: Generated<string>
  title_en: Generated<string>
  created_at: SqliteDate
  updated_at: SqliteDate
}

export interface VolumesTable {
  id: string
  mongo_id: string | null
  book_id: string
  book_name: string | null
  book_title: string | null
  number: number
  slug: string
  title_ar: string | null
  title_ms: string
  title_en: string | null
  transliteration_ms: string | null
  transliteration_en: string | null
  metadata_ar: string | null
  metadata_ms: string | null
  metadata_en: string | null
  hadith_first: number | null
  hadith_last: number | null
  created_at: SqliteDate
  updated_at: SqliteDate
}

export interface ChaptersTable {
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
  created_at: SqliteDate
  updated_at: SqliteDate
  lexicalState: string | null
}

export interface HadithsTable {
  id: string
  number: number
  mongo_id: string
  volume_id: string
  book_id: string
  chapter_id: string | null
  content: string
  footnotes: string | null
  lexicalState: string | null
  audio_files: string | null
  volume_title: string | null
  volume_name: string | null
  volume_metadata: string | null
  book_title: string | null
  book_name: string | null
  chapter_title: string | null
  chapter_name: string | null
  chapter_transliteration: string | null
  chapter_metadata: string | null
  processed: SqliteBool
  created_at: SqliteDate
  volume_number: number | null
  volume_name_ms: string | null
  sort_order: number | null
  variant: string | null
}

export interface HadithFootnotesTable {
  id: Generated<number>
  hadith_id: string
  scope: 'chapter' | 'hadith' | 'volume'
  type: string
  base_type: string | null
  language: 'ar' | 'ms' | 'en' | null
  position: number
  number: number
  hadith_index: number
  content: string
  created_at: SqliteDate
  chapter_id: string | null
  volume_id: string | null
}

export interface ChapterFootnotesTable {
  id: Generated<number>
  chapter_id: string
  type: string
  base_type: string | null
  language: 'ar' | 'ms' | 'en' | null
  position: number
  number: number
  hadith_index: number | null
  content: string
  created_at: SqliteDate
}

export interface VolumeFootnotesTable {
  id: Generated<number>
  volume_id: string
  type: string
  base_type: string | null
  language: 'ar' | 'ms' | 'en' | null
  position: number
  number: number
  hadith_index: number | null
  content: string
  created_at: SqliteDate
}

export interface SurahsTable {
  id: string
  mongo_id: string | null
  number: number
  hadith_number: number | null
  title_ar: string | null
  title_ms: string | null
  title_en: string | null
  transliteration_ms: string | null
  transliteration_en: string | null
  content: string | null
  created_at: SqliteDate
  updated_at: SqliteDate
}

export interface Hadith40Table {
  number: number
  id: string
  hadith_title: string
  narrators: string
  narrated_by: string
  content: string
  lesson: string
  footnotes: string | null
  created_at: SqliteDate
}

export interface HadithVectorsTable {
  id: Generated<number>
  hadith_id: string
  content_index: Generated<number>
  embedding_v2: Uint8Array
  created_at: SqliteDate
  book_name: string | null
}

// Precomputed "hadis berkaitan" edges. One row per (source hadith -> related
// hadith). Built offline by scripts/build-hadith-relations.ts from cosine
// similarity over hadith_vectors.embedding_v2. `score` is cosine similarity
// (1 = identical). `relation_type` is derived from score bands.
export interface HadithRelationsTable {
  hadith_id: string
  related_id: string
  relation_type: 'parallel' | 'related'
  score: number
}

// Maps each Hadis 40 (Imam Nawawi) entry to its direct source(s) in the Kutub
// Sittah corpus. One row per source; a Nawawi hadith can have 1-2+ sources.
// hadith_id refs hadiths.id; book slug/number/variant come from joining hadiths.
// is_primary marks the chapter-aligned/featured source. Built + matn-verified
// from sunnah.com takhrij. #30 and #41 have no corpus source (outside the six).
export interface Hadith40SourcesTable {
  hadith40_number: number
  hadith_id: string
  is_primary: SqliteBool
}

// Admin edit trail, written by the hadith/chapter PUT routes (was the Mongo
// `Audits` collection; migrated rows keep their Mongo hex id, new rows get a
// UUID). `changes` is the full diff for one save.
export interface AuditLogTable {
  id: string
  timestamp: string // ISO-8601
  user_email: string
  document_id: string // hadiths.id / chapters.id of the edited row
  collection: string // 'Hadiths' | 'Chapters'
  action: string // 'update'
  changes: string // JSON: [{field, oldValue, newValue}]
}

// Frozen archive of the pre-Turso bulk chapter-metadata fix (was the Mongo
// `ChapterMetadataAudit` collection). Nothing writes this anymore.
export interface ChapterMetadataAuditTable {
  id: string
  hadith_id: string
  hadith_number: number | null
  chapter_id: string | null
  old_values: string | null // JSON
  new_values: string | null // JSON
  updated_at: string | null // ISO-8601
  updated_by: string | null
}

export interface Database {
  books: BooksTable
  volumes: VolumesTable
  chapters: ChaptersTable
  hadiths: HadithsTable
  hadith_footnotes: HadithFootnotesTable
  chapter_footnotes: ChapterFootnotesTable
  volume_footnotes: VolumeFootnotesTable
  surahs: SurahsTable
  hadith40: Hadith40Table
  hadith_vectors: HadithVectorsTable
  hadith_relations: HadithRelationsTable
  hadith40_sources: Hadith40SourcesTable
  audit_log: AuditLogTable
  chapter_metadata_audit: ChapterMetadataAuditTable
}
