import { Link, createFileRoute } from '@tanstack/react-router'
import { ChevronRightSquare } from 'lucide-react'
import Pagination from '@/components/Pagination'
import QuranText from '@/components/QuranText'
import { Skeleton } from '@/components/ui/skeleton'
import { searchHadiths, searchModes, type SearchMode } from '@/server/search'

// URL contract unchanged from the Next.js app:
// /search?term=...&page=1&mode=semantic|text|hybrid&books=a,b
type SearchPageParams = {
  term?: string
  page: number
  mode: SearchMode
  books?: string
}

const BOOK_FILTERS = [
  { name: 'sahih_bukhari', title: 'Sahih al-Bukhari' },
  { name: 'sahih_muslim', title: 'Sahih Muslim' },
  { name: 'sunan_abi_daud', title: 'Sunan Abu Dawud' },
  { name: 'jami_al_tirmidhi', title: "Jami' Al-Tirmidhi" },
  { name: 'sunan_ibnu_majah', title: 'Sunan Ibn Majah' },
  { name: 'sunan_an_nasai', title: "Sunan Al-Nasa'i" },
] as const

export const Route = createFileRoute('/_main/search')({
  validateSearch: (search: Record<string, unknown>): SearchPageParams => ({
    term:
      typeof search.term === 'string' && search.term.trim()
        ? search.term
        : undefined,
    page:
      Number.isInteger(Number(search.page)) && Number(search.page) > 0
        ? Number(search.page)
        : 1,
    mode: searchModes.includes(search.mode as SearchMode)
      ? (search.mode as SearchMode)
      : 'semantic',
    books:
      typeof search.books === 'string' && search.books ? search.books : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    deps.term
      ? searchHadiths({
          data: {
            term: deps.term,
            page: deps.page,
            mode: deps.mode,
            books: deps.books,
          },
        })
      : null,
  // Semantic search takes 1-2s (embedding + vector query); show skeletons
  // quickly instead of freezing on the previous page.
  pendingMs: 150,
  pendingMinMs: 200,
  pendingComponent: SearchLoadingFallback,
  // Back/forward between result pages reuses data without re-querying.
  staleTime: 5 * 60 * 1000,
  component: SearchPage,
})

function SearchLoadingFallback() {
  return (
    <div className="mb-20">
      <div className="bg-royal-blue p-8 px-8 md:px-40">
        <Skeleton className="h-8 w-64 bg-white/20" />
      </div>
      <div className="py-8 px-8 lg:px-40">
        <div className="mb-6 flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="mb-6">
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="mb-4">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="grid-cols-1 lg:grid-cols-2 gap-12 grid p-8 bg-white shadow-xs"
            >
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SearchPage() {
  const { term = '', mode, books = '' } = Route.useSearch()
  const data = Route.useLoaderData()

  const documents = data?.documents ?? []
  const count = data?.totalCount?.[0]?.count ?? 0

  if (!term) {
    return (
      <div className="mb-20">
        <div className="bg-royal-blue p-8 px-8 md:px-40">
          <p className="text-2xl font-bold text-white">Carian</p>
        </div>
        <div className="py-16 px-8 lg:px-40">
          <p className="text-center text-gray-600">
            Sila masukkan kata kunci carian
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-20">
      <div className="bg-royal-blue p-8 px-8 md:px-40">
        <p className="text-2xl font-bold text-white">Hasil carian: "{term}"</p>
      </div>
      <div className="py-8 px-8 lg:px-40">
        {/* Mode Toggle */}
        <div className="mb-6 flex gap-2">
          {(
            [
              ['semantic', 'Carian Semantik'],
              ['text', 'Carian Teks'],
              ['hybrid', 'Carian Hibrid'],
            ] as const
          ).map(([m, label]) => (
            <Link
              key={m}
              to="/search"
              search={{ term, page: 1, mode: m, books: books || undefined }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === m
                  ? 'bg-royal-blue text-white'
                  : 'border border-royal-blue text-royal-blue hover:bg-royal-blue hover:text-white'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        {/* Search mode description */}
        <div className="mb-6 text-sm text-gray-600">
          {mode === 'text' ? (
            <p>Carian teks: Cari perkataan tepat seperti "solat", "puasa"</p>
          ) : mode === 'hybrid' ? (
            <p>
              Carian hibrid: Gabungan carian teks dan carian semantik. Sesuai
              untuk pertanyaan yang ada nama orang ("Umar") dan tema sekali
              ("hadis tentang solat"). Menunjukkan 20 hasil paling relevan.
            </p>
          ) : (
            <p>
              Carian semantik: Tanya soalan seperti "hadis tentang solat" atau
              "faedah berpuasa". Menunjukkan 20 hasil paling relevan
              berdasarkan makna.
            </p>
          )}
        </div>
      </div>
      <div className="py-8 px-8 lg:px-40 grid grid-cols-1 md:grid-cols-2">
        <div className="flex flex-wrap flex-col md:flex-row gap-2">
          {BOOK_FILTERS.map((b) => (
            <Link
              key={b.name}
              to="/search"
              search={{ term, page: 1, mode, books: b.name }}
              className={`text-sm rounded-md border border-royal-blue p-2 ${books === b.name ? 'bg-royal-blue text-white' : ''}`}
            >
              {b.title}
            </Link>
          ))}
        </div>
        {/* Only show pagination for text search */}
        {mode === 'text' && <Pagination count={count} />}
        {/* Show result count for semantic + hybrid (top-N, no pagination) */}
        {(mode === 'semantic' || mode === 'hybrid') && count > 0 && (
          <div className="text-right">
            <p className="text-sm text-gray-600">
              Menunjukkan {count} hasil paling relevan
            </p>
          </div>
        )}
      </div>
      <div className="py-16 px-8 lg:px-40 bg-gray-100 grid gap-2">
        {documents.length > 0 ? (
          documents.map((doc, i) => {
            const bookSlug = doc.book.slug
            const volumeSlug = doc.volume.slug
            // Per-hadith page route: /<book_slug>/<number>[/<variant>]
            const hadithHref = doc.variant
              ? `/${bookSlug}/${doc.number}/${doc.variant}`
              : `/${bookSlug}/${doc.number}`
            const msHighlight = doc.highlights?.ms
            const arHighlight = doc.highlights?.ar
            // Semantic/hybrid carry a single matching content entry; text
            // search returns full content with <mark> highlights.
            const entries =
              (mode === 'semantic' || mode === 'hybrid') &&
              doc.content_index !== undefined
                ? [doc.content[0] ?? doc.content[doc.content_index]].filter(
                    Boolean,
                  )
                : (doc.content ?? [])
            return (
              <div key={doc.id + i} className="grid">
                <div className="flex flex-wrap items-center gap-1 pt-4 pb-2">
                  <Link to="/book/$slug" params={{ slug: bookSlug }}>
                    <p className="text-royal-blue hover:underline font-sans text-sm font-semibold">
                      {doc.book.title_ms}
                    </p>
                  </Link>
                  <span className="text-xs">
                    <ChevronRightSquare color="black" size={18} />
                  </span>
                  <Link
                    to="/book/$slug/$volume"
                    params={{ slug: bookSlug, volume: volumeSlug }}
                  >
                    <p className="text-royal-blue hover:underline font-sans text-sm font-semibold capitalize">
                      {doc.volume.title_ms.toLowerCase()}
                    </p>
                  </Link>
                  <span className="text-xs">
                    <ChevronRightSquare color="black" size={18} />
                  </span>
                  <a href={hadithHref}>
                    <p className="text-royal-blue hover:underline font-sans text-sm font-semibold">
                      {doc.label}
                    </p>
                  </a>
                </div>
                {entries.map((content, j) => (
                  <a
                    href={hadithHref}
                    key={j}
                    className="grid-cols-1 lg:grid-cols-2 gap-12 grid p-8 bg-white shadow-xs"
                  >
                    <p className="order-2 lg:order-1 text-md text-justify whitespace-pre-line font-arabic-symbol">
                      {msHighlight ? (
                        <span dangerouslySetInnerHTML={{ __html: msHighlight }} />
                      ) : (
                        <QuranText text={content.ms} font="font-arabic-symbol" />
                      )}
                    </p>
                    <p
                      lang="ar"
                      dir="rtl"
                      className="order-1 lg:order-2 text-xl text-justify whitespace-pre-line font-arabic leading-relaxed"
                    >
                      {arHighlight ? (
                        <span dangerouslySetInnerHTML={{ __html: arHighlight }} />
                      ) : (
                        <QuranText text={content.ar} />
                      )}
                    </p>
                  </a>
                ))}
              </div>
            )
          })
        ) : (
          <p>Tiada hasil carian dijumpai</p>
        )}
        {/* Only show pagination at bottom for text search */}
        {mode === 'text' && (
          <div className="mt-10">
            <Pagination count={count} />
          </div>
        )}
      </div>
    </div>
  )
}
