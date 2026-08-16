import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import type { SearchResult } from '@/lib/semantic-search'

export const searchModes = ['text', 'semantic', 'hybrid'] as const
export type SearchMode = (typeof searchModes)[number]

// Same dispatch as the old GET /api/search (web path): semantic and hybrid
// return top-20, text search paginates via FTS5. The mobile variant of this
// endpoint (UA gating, update-required payload) is ported separately with the
// API routes.
const searchInput = z.object({
  term: z.string().trim().min(1),
  page: z.number().int().min(1).catch(1).default(1),
  mode: z.enum(searchModes).catch('semantic').default('semantic'),
  books: z.string().optional(),
})

export type SearchData = {
  documents: SearchResult[]
  totalCount: Array<{ count: number }>
  currentPage: number
}

export const searchHadiths = createServerFn({ method: 'GET' })
  .inputValidator(searchInput)
  .handler(async ({ data }): Promise<SearchData> => {
    const { term, page, mode, books } = data
    const selectedBooks = books ? books.split(',') : undefined

    if (mode === 'semantic') {
      const { semanticSearchWithPagination } = await import(
        '@/lib/semantic-search'
      )
      return semanticSearchWithPagination(term, 1, 20, selectedBooks)
    }

    if (mode === 'hybrid') {
      const { hybridSearchHadith } = await import('@/lib/hybrid-search')
      return hybridSearchHadith(term, 1, 20, selectedBooks)
    }

    const { textSearchHadithWithPagination } = await import('@/lib/text-search')
    return textSearchHadithWithPagination(term, page, 10, selectedBooks)
  })
