import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { cn } from '@/lib/utils'
import {
  generateItemListSchema,
  generateHadithCollectionSchema,
  generateBreadcrumbSchema,
} from '@/lib/structured-data'
import type { BookWithStats } from '@/lib/queries/books'

const PAGE_TITLE = 'Kutub Sittah | My Way'
const PAGE_DESCRIPTION =
  "Pelajari enam koleksi hadis utama (Kutub Sittah): Sahih al-Bukhari, Sahih Muslim, Sunan Abu Dawud, Jami' Al-Tirmidhi, Sunan Al-Nasa'i, dan Sunan Ibn Majah. Hadis sahih dan autentik dalam bahasa Melayu, Arab, dan Inggris."

// Dynamic import keeps kysely/@libsql out of the client bundle; the server-fn
// compiler strips the handler body from the browser build.
const getBooks = createServerFn({ method: 'GET' }).handler(
  async (): Promise<BookWithStats[]> => {
    const { getBooksWithStats } = await import('@/lib/queries/books')
    return getBooksWithStats()
  },
)

const bookArabicTitle: Record<string, string> = {
  bukhari: 'صحيح البخاري',
  muslim: 'صحيح مسلم',
  tirmidhi: 'سنن الترمذي',
  nasai: 'سنن النسائي',
  'abi-daud': 'سنن أبي داود',
  'ibn-majah': 'سنن ابن ماجه',
}

export const Route = createFileRoute('/_main/books')({
  loader: () => getBooks(),
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: 'description', content: PAGE_DESCRIPTION },
      { property: 'og:title', content: PAGE_TITLE },
      { property: 'og:description', content: PAGE_DESCRIPTION },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://www.myway.my/books' },
      { property: 'og:image', content: 'https://www.myway.my/opengraph-image.jpg' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: 'Kutub Sittah - My Way' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: PAGE_TITLE },
      { name: 'twitter:description', content: PAGE_DESCRIPTION },
      {
        name: 'twitter:image',
        content: 'https://www.myway.my/opengraph-image.jpg',
      },
    ],
    links: [{ rel: 'canonical', href: 'https://www.myway.my/books' }],
  }),
  component: BooksPage,
})

function BooksPage() {
  const books = Route.useLoaderData()

  // Calculate total hadiths across all books
  const totalHadiths = books.reduce(
    (sum, book) => sum + (book.total_hadiths || 0),
    0,
  )

  // Generate ItemList for all books
  const itemListSchema = generateItemListSchema(
    books.map((book, index) => ({
      position: index + 1,
      name: book.title_ms,
      url: `https://www.myway.my/book/${book.slug}`,
      image: `https://www.myway.my/api/og?title=${encodeURIComponent(book.title_ms)}`,
      description: `${book.last_volume_number} Kitab dengan ${book.total_hadiths} hadis`,
    })),
  )

  // Generate Hadith Collection schema
  const hadithCollectionSchema = generateHadithCollectionSchema({
    name: 'My Way - Koleksi Hadis Sahih',
    description:
      'Pelajari enam koleksi hadis utama (Kutub Sittah) dengan penerjemahan lengkap dalam bahasa Melayu, Arab, dan Inggris',
    url: 'https://www.myway.my/books',
    bookCount: books.length,
    hadithCount: totalHadiths,
    inLanguage: ['ms', 'ar', 'en'],
    image: 'https://www.myway.my/api/og',
  })

  // Generate Breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://www.myway.my' },
    { name: 'Koleksi Hadis', url: 'https://www.myway.my/books' },
  ])

  return (
    <main className="bg-[radial-gradient(circle,#eaeaea_1px,transparent_1px)] bg-[size:10px_10px]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(hadithCollectionSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <header className="max-w-4xl mx-auto px-4 pt-12 pb-6 text-center">
        <h1 className="text-3xl lg:text-4xl font-bold font-serif capitalize">
          Kutub Sittah: Enam Kitab Hadis Sahih
        </h1>
        <p className="mt-4 text-sm text-gray-600 leading-relaxed font-sans">
          Al-Kutub al-Sittah ialah enam kitab hadis utama yang menjadi rujukan
          primer umat Islam: Sahih al-Bukhari, Sahih Muslim, Sunan Abu Dawud,
          Jami' Al-Tirmidhi, Sunan Al-Nasa'i, dan Sunan Ibn Majah. Lebih 30,000
          hadis sahih dengan teks Arab dan terjemahan Bahasa Melayu.
        </p>
      </header>
      <div className="lg:bg-sky-950 bg:white my-10 mx-2 px-1 border-y-0 border-gray-200/50">
        <div className="bg-[#fefefe] relative grid p-4 lg:p-10 border border-gray-200/50 lg:grid-cols-2 gap-2 w-full lg:min-w-4xl ">
          {books.map((book) => {
            return (
              <div className="relative" key={book.id}>
                <div className="absolute left-0 top-0 h-full w-full bg-[size:10px_10px] bg-[image:repeating-linear-gradient(315deg,white,white_6px,rgba(59,130,246,0.6)_5px,rgba(59,130,246,0.6)_7px)] border border-[#d6d6d6]"></div>
                <a href={`/book/${book.slug}`}>
                  <div
                    className={cn(
                      'group relative col-span-3 flex flex-col justify-between overflow-hidden',
                      // light styles
                      'hover:-translate-x-1.5 hover:-translate-y-1.5 transition-transform duration-200',
                      'bg-white border border-[#d6d6d6]',
                    )}
                  >
                    <div className="absolute top-0 left-0 text-[#f80] p-1 font-mono text-[10px]">
                      <p>
                        [ {book.last_volume_number} Kitab / {book.total_hadiths}{' '}
                        Hadis ]
                      </p>
                    </div>
                    <div className="flex flex-col justify-center items-center gap-4 py-16 px-2">
                      <p className="text-4xl font-book text-royal-blue/80">
                        {bookArabicTitle[book.slug]}
                      </p>
                      <h2 className="text-2xl text-royal-blue font-semibold">
                        {book.title_ms}
                      </h2>
                    </div>
                    <div className="group-hover:bg-gray-200/50 absolute flex gap-2 bottom-0 right-0 border-l border-t text-black border-black p-2  font-mono text-[10px] leading-none">
                      <p>
                        KLIK
                        <span className="text-sm leading-none"> ↗</span>
                      </p>
                    </div>
                  </div>
                </a>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
