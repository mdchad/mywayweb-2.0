import type { Hadith, HadithPreview } from '@/lib/types/hadith'

// Pure shape adapters between the canonical clean Hadith domain shape and the
// wire formats. No DB imports here so these stay unit-testable.

export const hadithToPreview = (h: Hadith): HadithPreview => ({
  id: h.id,
  number: h.number,
  variant: h.variant,
  label: h.label,
  content: h.content.map((c) => ({ ar: c.ar, ms: c.ms })),
  book: { id: h.book.id, slug: h.book.slug, title_ms: h.book.title_ms },
  volume: { id: h.volume.id, slug: h.volume.slug, title_ms: h.volume.title_ms },
})
