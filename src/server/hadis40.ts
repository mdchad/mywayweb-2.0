import { createServerFn } from '@tanstack/react-start'
import { DAY_SECONDS, setCacheControl } from '@/server/cache'
import type { Hadis40ListItem, Hadis40Source } from '@/lib/hadith40'

export type Hadis40ListData = {
  hadiths: Hadis40ListItem[]
  // Map from the query is flattened to a record for loader serialization.
  sourcesByNumber: Record<number, Hadis40Source[]>
}

export const fetchHadis40List = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Hadis40ListData> => {
    const { getAllHadis40ForList, getAllHadis40Sources } = await import(
      '@/lib/hadith40'
    )
    const [hadiths, sourcesMap] = await Promise.all([
      getAllHadis40ForList(),
      getAllHadis40Sources(),
    ])
    await setCacheControl(DAY_SECONDS)
    return {
      hadiths,
      sourcesByNumber: Object.fromEntries(sourcesMap),
    }
  },
)
