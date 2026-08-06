import { createServerFn } from '@tanstack/react-start'
import { DAY_SECONDS, setCacheControl } from '@/server/cache'
import type { BookListItem } from '@/lib/queries/books'

// One file per domain: routes stay declarative and the dynamic import keeps
// kysely/@libsql out of the client bundle.
export const fetchBooksList = createServerFn({ method: 'GET' }).handler(
  async (): Promise<BookListItem[]> => {
    const { getBooksForList } = await import('@/lib/queries/books')
    await setCacheControl(DAY_SECONDS)
    return getBooksForList()
  },
)
