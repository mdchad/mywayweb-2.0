import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { DAY_SECONDS, setCacheControl } from '@/server/cache'
import type { Book, Volume } from '@/lib/types/hadith'
import type { SurahRow } from '@/lib/queries/surahs'
import type { VolumeView } from '@/lib/queries/volume-view'

const QURAN_VOLUME_ID = 'be728413-131c-43a6-8481-d7c4704fa228'

export type VolumePageData =
  | {
      kind: 'ok'
      book: Book
      volume: Volume
      view: VolumeView
      totalCount: number
      surahs: SurahRow[]
    }
  // Numeric volume URLs (/book/bukhari/5) 301 to the slug URL, matching the
  // old NEMO middleware behaviour.
  | { kind: 'redirect'; volumeSlug: string }
  | null

export const fetchVolumePage = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({ slug: z.string().min(1), volumeParam: z.string().min(1) }),
  )
  .handler(async ({ data }): Promise<VolumePageData> => {
    const [
      { getVolumeBySlug, getVolumeByBookSlugAndNumber },
      { getBookById },
      { getAllSurahs },
      { getHadithCountForVolume },
      { getVolumeView },
    ] = await Promise.all([
      import('@/lib/queries/volumes'),
      import('@/lib/queries/books'),
      import('@/lib/queries/surahs'),
      import('@/lib/queries/hadiths'),
      import('@/lib/queries/volume-view'),
    ])

    const numeric = !isNaN(Number(data.volumeParam))
    const volume = numeric
      ? await getVolumeByBookSlugAndNumber(data.slug, parseInt(data.volumeParam))
      : await getVolumeBySlug(data.slug, data.volumeParam)
    if (!volume) return null

    if (numeric) return { kind: 'redirect', volumeSlug: volume.slug }

    const book = await getBookById(volume.book_id)
    if (!book) return null

    const [view, totalCount, surahs] = await Promise.all([
      getVolumeView(volume, book),
      getHadithCountForVolume(volume.id),
      volume.id === QURAN_VOLUME_ID ? getAllSurahs() : Promise.resolve([]),
    ])

    await setCacheControl(DAY_SECONDS)
    return { kind: 'ok', book, volume, view, totalCount, surahs }
  })
