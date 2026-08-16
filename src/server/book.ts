import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { DAY_SECONDS, setCacheControl } from '@/server/cache'
import type { Book, Volume } from '@/lib/types/hadith'

export type BookVolumesData = {
  book: Book
  volumes: Volume[]
} | null

// Was `force-static` + generateStaticParams in Next; here it's SSR behind the
// same day-long CDN cache as the other content pages.
export const fetchBookVolumes = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }): Promise<BookVolumesData> => {
    const [{ getBookBySlug }, { getVolumesByBookSlug }] = await Promise.all([
      import('@/lib/queries/books'),
      import('@/lib/queries/volumes'),
    ])
    const [book, volumes] = await Promise.all([
      getBookBySlug(data.slug),
      getVolumesByBookSlug(data.slug),
    ])
    if (!book) return null
    await setCacheControl(DAY_SECONDS)
    return { book, volumes }
  })
