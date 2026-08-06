import { createFileRoute } from '@tanstack/react-router'
import TodayCard from '@/components/TodayCard'
import { BookCard, AICard } from '@/components/Card'
import { GridPattern } from '@/components/grid-pattern'
import { cn } from '@/lib/utils'
import { TrackedIntroButton } from '@/components/TrackedIntroButton'
import { getTodayPreview } from '@/server/today'

const HOME_TITLE =
  'Koleksi Hadis Sahih: Hadis 40 Imam Nawawi dan Kutub Sittah | My Way'
const HOME_DESCRIPTION =
  "Koleksi hadis sahih: Hadis 40 Imam Nawawi dan Kutub Sittah (Sahih al-Bukhari, Sahih Muslim, Sunan Abu Dawud, Jami' Al-Tirmidhi, Sunan Al-Nasa'i, Sunan Ibn Majah)."

// The daily hadith preview only changes once a day (cron at 16:00 UTC), so
// SSR output is CDN-cacheable; edge caching + purge-on-cron replaces the old
// Next.js ISR (`revalidate = 86400` + `revalidatePath("/")`) and is wired up
// in the caching phase of the migration.
export const Route = createFileRoute('/_main/')({
  loader: () => getTodayPreview(),
  staleTime: 60 * 60 * 1000,
  preloadStaleTime: 60 * 60 * 1000,
  head: () => ({
    meta: [
      { title: HOME_TITLE },
      { name: 'description', content: HOME_DESCRIPTION },
      { property: 'og:title', content: HOME_TITLE },
      { property: 'og:description', content: HOME_DESCRIPTION },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://www.myway.my' },
      { property: 'og:image', content: 'https://www.myway.my/opengraph-image.jpg' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      {
        property: 'og:image:alt',
        content:
          'My Way | Koleksi Hadis Sahih, Hadis 40 Imam Nawawi & Kutub Sittah',
      },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: HOME_TITLE },
      { name: 'twitter:description', content: HOME_DESCRIPTION },
      {
        name: 'twitter:image',
        content: 'https://www.myway.my/opengraph-image.jpg',
      },
    ],
    links: [{ rel: 'canonical', href: 'https://www.myway.my' }],
  }),
  component: Home,
})

function Home() {
  const todayPreview = Route.useLoaderData()

  return (
    <main className="">
      <div className="bg-royal-blue py-12 px-8 text-white grid lg:grid-cols-2 gap-4 before:border-r-1 before:border-gray-200/50 before:border-dashed relative before:absolute before:top-0 before:bottom-0 before:left-0 before:w-8">
        <GridPattern
          width={20}
          height={20}
          squares={[
            [55, 4],
            [20, 1],
            [25, 3],
            [23, 7],
            [30, 10],
            [55, 4],
            [53, 1],
            [63, 3],
            [60, 5],
            [62, 8],
            [62, 8],
            [62, 8],
            [65, 12],
            [68, 2],
            [67, 8],
          ]}
          x={-1}
          y={-1}
          className={cn(
            '[mask-image:linear-gradient(to_bottom_left,white,transparent,transparent)] ',
          )}
        />
        <div className="p-6 relative before:h-px before:content-[''] before:top-0 before:left-0 before:w-[calc(100vw-2rem)] before:absolute before:bg-gray-100/20 after:h-px after:content-[''] after:bottom-0 after:left-0 after:w-[calc(100vw-2rem)] after:absolute after:bg-gray-100/20">
        <h1 className="text-3xl font-bold font-serif mb-4 capitalize">
            Koleksi Hadis Sahih Kutub Sittah
          </h1>
          <p className="font-sans text-sm capitalize text-white/80">
            Menghayati As-Sunnah dan Hadis yang terpelihara sebagai penerangan
            Al-Quran dengan terjemahan tepat dan lengkap untuk panduan hidup
            yang hakiki. Koleksi hadis sahih lengkap, daripada 42 Hadis Imam
            Nawawi hingga Kutub Sittah.
          </p>
          <TrackedIntroButton />
        </div>
        <div className="grid grid-cols-2 items-end">
          <div className="border-l border-gray-100/20 p-4 relative before:h-px before:content-[''] before:top-0 before:left-0 lg:before:w-[calc(50vw-0.5rem)] before:w-[calc(100vw-2rem)] before:absolute before:bg-gray-100/20 j after:h-px after:content-[''] after:bottom-0 after:left-0 lg:after:w-0 after:w-[calc(100vw-2rem)] after:absolute after:bg-gray-100/20">
            <p className="font-bold font-mono">30,000+</p>
            <p className="font-sans text-sm">Hadis</p>
          </div>
          <div className=" border-gray-100/20 p-4">
            <p className="font-bold font-mono">12</p>
            <p className="font-sans text-sm">Universiti</p>
          </div>
        </div>
      </div>
      <div className="border border-gray-100 h-5 bg-[repeating-linear-gradient(45deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed [--pattern-fg:#efefef]"></div>
      <div className="mx-auto mt-6 max-w-6xl bg-white">
        <h2 className="font-serif text-center text-neutral-600 mb-6">
          Kerjasama Dengan
        </h2>
        <div className="flex gap-8 flex-wrap justify-center">
          <img src="/images/ukm.png" alt="Universiti Kebangsaan Malaysia" width={96} height={40} className="h-6 w-auto lg:h-10" />
          <img src="/images/usim.png" alt="Universiti Sains Islam Malaysia" width={96} height={40} className="h-6 w-auto lg:h-10" />
          <img src="/images/upsi.png" alt="Universiti Pendidikan Sultan Idris" width={96} height={40} className="h-6 w-auto lg:h-10" />
          <img src="/images/um.png" alt="Universiti Malaya" width={96} height={40} className="h-6 w-auto lg:h-10" />
          <img src="/images/iium.png" alt="International Islamic University Malaysia" width={96} height={40} className="h-6 w-auto lg:h-10" />
          <img src="/images/utm.png" alt="Universiti Teknologi Malaysia" width={96} height={40} className="h-6 w-auto lg:h-10" />
          <img src="/images/unisza.png" alt="Universiti Sultan Zainal Abidin" width={96} height={40} className="h-6 w-auto lg:h-10" />
          <img src="/images/uitm.png" alt="Universiti Teknologi MARA" width={96} height={40} className="h-6 w-auto lg:h-10" />
          <img src="/images/unisiraj.png" alt="Universiti Islam Selangor" width={96} height={40} className="h-6 w-auto lg:h-10" />
          <img src="/images/unikl.png" alt="Universiti Kuala Lumpur" width={96} height={40} className="h-6 w-auto lg:h-10" />
          <img src="/images/mediu.png" alt="MEDIU" width={96} height={40} className="h-6 w-auto lg:h-10" />
          <img src="/images/dbp.png" alt="Dewan Bahasa dan Pustaka" width={96} height={40} className="h-6 w-auto lg:h-10" />
        </div>
      </div>
      <div className="relative">
        <div className="font-mono uppercase text-xs text-black absolute left-5 top-0">
          +
        </div>
        <div className="font-mono uppercase text-xs text-black absolute left-5 bottom-0">
          +
        </div>
        <div className="font-mono uppercase text-xs text-black absolute left-5 bottom-1/2">
          +
        </div>
        <div className="font-mono uppercase text-xs text-black absolute right-5 top-1/2">
          +
        </div>
        <div className="font-mono uppercase text-xs text-black absolute right-5 top-0">
          +
        </div>
        <div className="font-mono uppercase text-xs text-black absolute right-5 bottom-0">
          +
        </div>
        <div className="mx-auto my-10 max-w-6xl bg-white ">
          <div className="flex flex-col gap-2 bg-gray-200/50">
            <div className="grid grid-cols-2 grid-row grid-flow-row">
              <BookCard
                title="Hadis 40 Imam Nawawi"
                description={"42 hadis pilihan Imam An-Nawawi (Arba'in Nawawiyyah) sebagai panduan hidup Muslim"}
                path="/hadis40"
              />
              <BookCard
                title="Kutub Sittah"
                path="/books"
                description={"Enam kitab hadis sahih utama: Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasa'i, Ibn Majah"}
              />
            </div>
            <AICard
              title={'TANYA AI'}
              description={'Gunakan AI untuk menjawab pertanyaan-pertanyaan anda'}
              path="/chat"
              gradient={true}
            />
            <TodayCard data={todayPreview} />
          </div>
        </div>
      </div>
    </main>
  )
}
