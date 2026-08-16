import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import VolumeContainer from '@/components/VolumeContainer'
import { generateBreadcrumbSchema } from '@/lib/structured-data'
import { fetchBookVolumes } from '@/server/book'

const bookDescriptions: Record<string, string> = {
  bukhari:
    "Sahih al-Bukhari, buku hadis yang paling sahih, paling terjamin keabsahannya\n" +
    "daripada al-Kutub al-Sittah (enam kitab hadis primer Islam). Judul asal kitab ini\n" +
    "dapat diertikan dengan \"Himpunan Menyeluruh yang Bersambung (kepada baginda)\n" +
    "Lagi Sahih Berkenaan Rasulullah, sunnah serta kehidupan seharian baginda\"\n" +
    "Ia merupakan mahakarya dan magnum opus Mahaguru Hadis, Muhammad bin Ismail\n" +
    "al-Bukhari rahimahullah (194-256H/810-870M). Karya ini lebih dikenali dengan judul\n" +
    "ringkasnya Sahih al-Bukhari. Ia mengandungi 7563 hadis pilihan yang diterima dan\n" +
    "disepakati keabsahannya oleh ulama Islam sedunia, zaman berzaman sebagai kitab\n" +
    "yang paling benar sahih setelah al-Qur'an.",
  muslim:
    "Sahih Muslim, kitab hadis kedua yang paling sahih selepas Sahih al-Bukhari\n" +
    "malah hampir menyamainya. Salah satu buku hadis al-Kutub al-Sittah yang telah\n" +
    "dikarang oleh seorang lagi Mahaguru Hadis, Muslim bin Hajjaj al-Naysaburi\n" +
    "rahimahullah (204-261H/819-875M). Ia diakui dan diiktiraf keunggulannya oleh\n" +
    "para ulama sepanjang zaman, tidak lapuk ditelan zaman. Bergandingan dengan\n" +
    "Sahih al-Bukhari, ia disebut \"al-Sahihayn\" iaitu dua buku sahih. Koleksi ini\n" +
    "menghimpunkan lebih kurang 8000 hadis.",
  'abi-daud':
    "Sunan Abu Dawud mahakarya seorang alim besar dan ahli hadis terkemuka, Sulayman\n" +
    "bin Ash’ath al-Sijistani, yang lebih dikenali dengan gelaran beliau, Abu Dawud\n" +
    "rahimahullah (202-275H/817-889M). Beliau memilih 5274 hadis untuk dimuatkan dalam\n" +
    "43 kitab, yang mana kebanyakannya merangkumi permasalahan fiqh. Judul Sunan\n" +
    "membawa maksud himpunan hadis-hadis berkaitan fiqh dengan susunan bab-babnya\n" +
    "mirip dengan susunan bab dalam kitab fiqh. Susunan yang unik ini membantu\n" +
    "pembelajaran fiqh melalui hadis-hadis secara teratur dan sistematik sehingga kitab ini\n" +
    "mendapat sambutan 'ulama dunia Islam sejak awal kemunculannya.",
  tirmidhi:
    "Sunan Al-Tirmidhi atau Jami' Al-Tirmidhi merupakan salah satu kitab daripada al-Kutub\n" +
    "al-Sittah, karangan seorang tokoh hebat dalam bidang hadis, Abu 'Isa Muhammad\n" +
    "bin 'Isa al-Tirmidhi rahimahullāh (200-279H/815-892M). Ia diberi tajuk sebagai kitab\n" +
    "Sunan kerana bab-babnya disusun mengikut bab-bab fiqh. Dalam masa yang sama,\n" +
    "ia juga dikenali dengan Jami' yang bermaksud kitab ini memuatkan juga bab-bab\n" +
    "selain bab-bab fiqh. Himpunan hadisnya bersifat lebih menyeluruh yang menyerupai\n" +
    "al-Sahihayn (al-Bukhari dan Muslim). Ia meliputi pelbagai bab, misalnya Tafsir Mimpi,\n" +
    "Ekspedisi Peperangan Yang Disertai Rasulullah, Iman Dengan Akhirat dan sebagainya.\n" +
    "Bilangan hadis yang ada dalam buku ini berjumlah 3956 dalam 49 bab besar.",
  nasai:
    "Sunan Al-Nasa'i menduduki tempat ketiga paling sahih antara enam kitab hadis\n" +
    "sumber primer Islam di sisi sebahagian ulama kerana mengambil kira kepakaran\n" +
    "dan syarat riwayat yang lebih ketat yang diaplikasi oleh Mahaguru Hadis, Ahmad\n" +
    "bin Shu'ayb al-Nasā'i rahimahullah (215-303H/830-915M) dalam periwayatan\n" +
    "hadis. Sunan Al-Nasa'i berkedudukan sama tinggi dengan gandingan kitab-kitab\n" +
    "hadis yang lain sebagai sebuah kitab hadis sumber utama Islam yang mengandungi\n" +
    "sekumpulan hadis berkaitan permasalahan fiqh yang telah disaring dengan teliti.\n" +
    "Bilangan hadisnya sebanyak 5758 dalam 51 kitab (bab besar).",
  'ibn-majah':
    "Sunan Ibn Majah, kitab hadis keenam dalam turutan al-Kutub al-Sittah. Ia merupakan\n" +
    "mahakarya ahli hadis tersohor, Muhammad Bin Yazid ibn Majah al-Qazwini\n" +
    "rahimahullah (209-273H/824-887M). Buku ini mengadungi 4341 riwayat yang\n" +
    "disusun dalam 37 kitab (bab besar). Imam Ibn Majah telah menerima pujian baik\n" +
    "daripada para ahli hadis kerana pendekatan istimewa dalam karya beliau. Antara\n" +
    "kelebihan kitab ini ialah ia memuatkan sejumlah hadis yang tiada dalam kitab-kitab\n" +
    "Sunan dan Sahih yang lain.",
}

const bookMetaDescriptions: Record<string, string> = {
  bukhari:
    'Sahih al-Bukhari, mahakarya Imam Muhammad bin Ismail al-Bukhari rahimahullah (194-256H/810-870M), kitab hadis paling sahih selepas al-Quran. Mengandungi 7,563 hadis pilihan.',
  muslim:
    'Sahih Muslim, karangan Imam Muslim bin Hajjaj al-Naysaburi rahimahullah (204-261H/819-875M). Kitab hadis kedua paling sahih, dikenali sebagai al-Sahihayn bersama Bukhari.',
  'abi-daud':
    'Sunan Abu Dawud, mahakarya Imam Abu Dawud al-Sijistani rahimahullah (202-275H/817-889M). Memilih 5,274 hadis dalam 43 kitab, kebanyakannya merangkumi permasalahan fiqh.',
  tirmidhi:
    "Jami' Al-Tirmidhi, karangan Imam Abu 'Isa al-Tirmidhi rahimahullah (200-279H/815-892M). Memuatkan 3,956 hadis dalam 49 bab merangkumi fiqh, tafsir mimpi dan pelbagai topik.",
  nasai:
    "Sunan Al-Nasa'i, karangan Imam Ahmad bin Shu'ayb al-Nasa'i rahimahullah (215-303H/830-915M). Menduduki tempat ketiga paling sahih dengan 5,758 hadis dalam 51 kitab.",
  'ibn-majah':
    'Sunan Ibn Majah, mahakarya Imam Muhammad bin Yazid Ibn Majah rahimahullah (209-273H/824-887M). Mengandungi 4,341 hadis dalam 37 kitab termasuk hadis unik yang tiada di tempat lain.',
}

const FALLBACK_DESCRIPTION =
  'Pelajari sunnah Nabi Muhammad SAW melalui koleksi hadis dari Kutub Sittah yang sahih dan dipercayai.'

export const Route = createFileRoute('/_main/book/$slug/')({
  // q stays string | number: coercing numbers to strings here would make
  // the router re-serialize ?q=500 into ?q=%22500%22. Consumers String() it.
  validateSearch: (
    search: Record<string, unknown>,
  ): { q?: string | number } => ({
    q:
      (typeof search.q === 'string' && search.q) ||
      typeof search.q === 'number'
        ? (search.q as string | number)
        : undefined,
  }),
  loader: async ({ params }) => {
    const data = await fetchBookVolumes({ data: { slug: params.slug } })
    if (!data) throw notFound()
    return data
  },
  staleTime: 60 * 60 * 1000,
  preloadStaleTime: 60 * 60 * 1000,
  head: ({ loaderData, params }) => {
    const bookTitle = loaderData?.book.title_ms ?? 'Hadith Collection'
    const bookUrl = `https://www.myway.my/book/${params.slug}`
    const ogImage = `https://www.myway.my/api/og?title=${encodeURIComponent(bookTitle)}`
    const metaDescription =
      bookMetaDescriptions[params.slug] ?? FALLBACK_DESCRIPTION
    return {
      meta: [
        { title: `${bookTitle} | My Way` },
        { name: 'description', content: metaDescription },
        { property: 'og:title', content: `${bookTitle} | My Way` },
        { property: 'og:description', content: metaDescription },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: bookUrl },
        { property: 'og:image', content: ogImage },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: `${bookTitle} | My Way` },
        { name: 'twitter:description', content: metaDescription },
        { name: 'twitter:image', content: ogImage },
      ],
      links: [{ rel: 'canonical', href: bookUrl }],
    }
  },
  component: BookPage,
})

function BookPage() {
  const { slug } = Route.useParams()
  const { book, volumes } = Route.useLoaderData()

  const bookUrl = `https://www.myway.my/book/${slug}`
  const bookTitle = book.title_ms
  const description = bookDescriptions[slug] ?? FALLBACK_DESCRIPTION

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://www.myway.my' },
    { name: 'Books', url: 'https://www.myway.my/books' },
    { name: bookTitle, url: bookUrl },
  ])

  // Use Book schema with HasPart for volumes
  const bookSchema = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: bookTitle,
    description,
    url: bookUrl,
    image: `https://www.myway.my/api/og?title=${encodeURIComponent(bookTitle)}`,
    inLanguage: ['ms', 'ar', 'en'],
    numberOfPages: volumes.reduce((sum, vol) => sum + (vol.hadith_last || 0), 0),
    hasPart: volumes.map((vol) => ({
      '@type': 'Chapter',
      name: vol.title_ms || vol.slug,
      position: vol.number,
      url: `${bookUrl}/${vol.slug}`,
    })),
    publisher: {
      '@type': 'Organization',
      name: 'My Way',
      url: 'https://www.myway.my',
    },
  }

  return (
    <div className="mb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(bookSchema),
        }}
      />
      <div className="grid lg:grid-cols-[1fr_auto_1fr] grid-cols-[1fr]">
        <div className="lg:border-gray-200/50 lg:border-y"></div>
        <div className="relative w-full lg:w-4xl py-4 px-2 border border-gray-200/50 before:absolute before:top-0 before:bottom-0 before:left-0 before:w-4 before:border-r-1 before:border-gray-200/50 after:absolute after:top-0 after:bottom-0 after:right-0 after:w-4 after:border-l-1 after:border-gray-200/50">
          <div className="w-full relative before:h-px before:content-[''] before:top-0 before:left-[49%] before:w-[100vw] before:absolute before:bg-gray-200/50 before:-translate-x-1/2 after:h-px after:content-[''] after:bottom-0 after:left-[49%] after:w-[100vw] after:absolute after:bg-gray-200/50 after:-translate-x-1/2">
            <h1 className="text-4xl font-bold text-center py-4">
              {bookTitle}
            </h1>
          </div>
        </div>
        <div className="lg:border-gray-200/50 lg:border-y"></div>
      </div>
      <div className="grid lg:grid-cols-[1fr_auto_1fr] grid-cols-[1fr]">
        <div className="lg:border-gray-200/50 lg:border-b"></div>
        <div className="w-full lg:w-4xl px-6 py-4 border-x border-b border-gray-200/50">
          <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
        </div>
        <div className="lg:border-gray-200/50 lg:border-b"></div>
      </div>
      {volumes && <VolumeContainer volumes={volumes} slug={slug} />}
      <div className="fixed sm:bottom-1 bottom-0 left-1 bg-gray-200 hover:border-t hover:border-r hover:border-gray-500 transition-border duration-50">
        <Link
          className="block font-mono text-xs p-2 bg-white hover:-translate-x-0.5 hover:translate-y-0.5 transition-transform duration-200 border-t border-r border-gray-500"
          to="/books"
        >
          ← Senarai Buku
        </Link>
      </div>
    </div>
  )
}
