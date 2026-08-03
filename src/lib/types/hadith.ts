// Canonical clean shapes for hadith / chapter / volume / book.
//
// Replaces the legacy denormalized Mongo-ish shape that used to look like
// `hadith.chapter_title.ms`. New shape mirrors the normalized DB:
//   hadith.chapter.title_ms
//   hadith.volume.title_ms
//   hadith.book.title_ms
//
// Mobile API responses now use this shape too (intentional breaking change
// from 2026-05-14 — mobile app will be updated to match).

export type Language = 'ar' | 'ms' | 'en';

export type ContentEntry = {
  ar: string;
  ms: string;
  en?: string;
};

export type AudioFiles = Record<string, Record<string, string>>;

export type Book = {
  id: string;
  mongo_id: string | null;
  slug: string;
  name: string;
  title_ms: string;
  title_ar: string;
  title_en: string;
  created_at?: string;
  updated_at?: string;
};

export type Volume = {
  id: string;
  mongo_id: string | null;
  book_id: string;
  number: number;
  slug: string;
  title_ms: string;
  title_ar: string;
  title_en: string;
  metadata_ms: string;
  metadata_ar: string;
  metadata_en: string;
  transliteration_ms: string;
  transliteration_en: string;
  hadith_first: number | null;
  hadith_last: number | null;
  extra_numbers?: number[];
  variant_anchors?: Record<number, string>;
  created_at?: string;
  updated_at?: string;
};

export type VolumeWithBookSlug = Volume & { book_slug: string };

export type Chapter = {
  id: string;
  name: string;
  number: number | null;
  title_ms: string;
  title_ar: string;
  title_en: string;
  metadata_ms: string;
  metadata_ar: string;
  metadata_en: string;
  transliteration_ms: string;
  transliteration_en: string;
  lexicalState: Record<string, any> | null;
};

export type Hadith = {
  id: string;
  number: number;
  variant: string | null;
  label: string;
  sort_order: number | null;
  mongo_id: string;
  content: ContentEntry[];
  audio_files: AudioFiles;
  // Per-language lexical editor state — null for hadiths that haven't been
  // migrated off plain text yet. Shape (when populated):
  //   { content: [{ ms?: SerializedLex, ar?: SerializedLex, en?: SerializedLex }, ...] }
  lexicalState: Record<string, any> | null;

  book_id: string;
  volume_id: string;
  chapter_id: string | null;

  book: Book;
  volume: Volume;
  chapter: Chapter | null;
};

export type FootnoteScope = 'hadith' | 'chapter' | 'volume';

export type Footnote = {
  id: number;
  scope: FootnoteScope;
  type: string;
  base_type: string | null;
  language: Language | null;
  position: number;
  number: number;
  hadith_index: number | null;
  content: string;
};

export type HadithFootnotes = {
  hadith: Footnote[];
  chapter: Footnote[];
  volume: Footnote[];
};

export type HadithWithFootnotes = Hadith & {
  footnotes: HadithFootnotes;
};

export type HadithAdmin = HadithWithFootnotes & {
  lexicalState: Record<string, any> | null;
  processed: boolean;
};

export type HadithNeighbor = {
  number: number;
  variant: string | null;
  label: string;
};

export type HadithDetail = HadithWithFootnotes & {
  neighbors: {
    prev?: HadithNeighbor;
    next?: HadithNeighbor;
  };
  hadith_created_at?: string;
  volume_updated_at?: string;
};

export type HadithPreview = {
  id: string;
  number: number;
  variant: string | null;
  label: string;
  content: Array<Pick<ContentEntry, 'ar' | 'ms'>>;
  book: Pick<Book, 'id' | 'slug' | 'title_ms'>;
  volume: Pick<Volume, 'id' | 'slug' | 'title_ms'>;
};

export const labelOf = (number: number, variant: string | null): string =>
  variant ? `${number}/${variant}` : `${number}`;
