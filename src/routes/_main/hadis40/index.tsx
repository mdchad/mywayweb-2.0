import { createFileRoute } from '@tanstack/react-router'
import {
  generateCollectionSchema,
  generateBreadcrumbSchema,
  generateItemListSchema,
} from '@/lib/structured-data'
import Hadis40Item from '@/components/Hadis40Item'
import { fetchHadis40List } from '@/server/hadis40'

const PAGE_URL = 'https://www.myway.my/hadis40'
const PAGE_TITLE =
  'Hadis 40 Imam Nawawi: 42 Hadis Sahih Nabi Muhammad SAW | My Way'
const PAGE_DESCRIPTION =
  "Koleksi lengkap 42 hadis pilihan Imam Nawawi (Hadis 40 / Arba'in Nawawiyyah) dengan teks Arab, terjemahan Bahasa Melayu, audio, dan pengajaran. Rujukan hadis sahih Nabi Muhammad SAW dalam satu tempat.";

export const Route = createFileRoute('/_main/hadis40/')({
  loader: () => fetchHadis40List(),
  // Content changes only on admin edits; don't refire the loader RPC on
  // every hover/navigation.
  staleTime: 60 * 60 * 1000,
  preloadStaleTime: 60 * 60 * 1000,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: 'description', content: PAGE_DESCRIPTION },
      { property: 'og:title', content: PAGE_TITLE },
      { property: 'og:description', content: PAGE_DESCRIPTION },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: PAGE_URL },
      { property: 'og:image', content: 'https://www.myway.my/opengraph-image.jpg' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      {
        property: 'og:image:alt',
        content: 'Hadis 40 Imam Nawawi, Koleksi Hadis Sahih Nabi Muhammad SAW',
      },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: PAGE_TITLE },
      { name: 'twitter:description', content: PAGE_DESCRIPTION },
      {
        name: 'twitter:image',
        content: 'https://www.myway.my/opengraph-image.jpg',
      },
    ],
    links: [{ rel: 'canonical', href: PAGE_URL }],
  }),
  component: Hadith40Page,
})

function Hadith40Page() {
  const { hadiths, sourcesByNumber } = Route.useLoaderData()

  const collectionSchema = generateCollectionSchema({
    name: "40 Hadis Imam Nawawi (Arba'in Nawawiyyah)",
    description:
      'Koleksi 42 hadis pilihan Imam Nawawi yang merangkumi prinsip-prinsip asas Islam sebagai panduan hidup Muslim dan rujukan hadis sahih Nabi Muhammad SAW.',
    url: PAGE_URL,
    itemCount: hadiths.length,
    image: 'https://www.myway.my/opengraph-image.jpg',
  })

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://www.myway.my' },
    { name: 'Hadis 40 Imam Nawawi', url: PAGE_URL },
  ])

  const itemListSchema = generateItemListSchema(
    hadiths.map((h) => ({
      position: h.number,
      name: `Hadis ${h.number}: ${h.hadith_title.ms}`,
      url: `${PAGE_URL}/${h.number}`,
    })),
  )

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      {/* Header */}
      <div className="grid lg:grid-cols-[1fr_auto_1fr] grid-cols-[1fr]">
        <div className="bg-[repeating-linear-gradient(45deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed [--pattern-fg:#efefef] border-b-1 border-gray-100/50" />
        <div className="py-8 px-10 bg-royal-blue lg:w-4xl w-full">
          <h1 className="text-3xl font-bold text-white text-left capitalize font-serif">
            Hadis 40 Imam Nawawi
          </h1>
          <p
            lang="ar"
            className="mt-12 text-4xl font-arabic font-bold text-white text-right"
          >
            الأربعين النووية
          </p>
          <p className="mt-6 text-sm text-white/80 font-mono uppercase tracking-widest">
            42 Hadis Sahih · Rujukan Imam An-Nawawi
          </p>
        </div>
        <div className="border-b-1 border-gray-100/50 bg-[repeating-linear-gradient(45deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed [--pattern-fg:#efefef]" />
      </div>

      {/* Pengenalan */}
      <section className="grid lg:grid-cols-[1fr_auto_1fr] grid-cols-[1fr]">
        <aside aria-hidden className="bg-[repeating-linear-gradient(45deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed [--pattern-fg:#efefef]" />
        <div className="lg:w-4xl w-full bg-white py-12 px-4 sm:px-8 border-x-1 border-gray-200/50 space-y-4">
          <h2 className="text-2xl font-serif font-bold text-gray-900">
            Pengenalan
          </h2>
          <p className="text-base leading-relaxed text-gray-700 font-arabic-symbol">
            Hadis 40 Imam Nawawi atau dikenali sebagai Arba&apos;in Nawawiyyah
            ialah koleksi 42 hadis pilihan yang disusun oleh Imam Yahya bin
            Sharaf an-Nawawi (1233-1277 Masihi), seorang ulama besar
            mazhab Syafi&apos;i dari Damsyik. Walaupun namanya &lsquo;empat
            puluh&rsquo;, Imam Nawawi sebenarnya memilih 42 hadis kerana setiap
            satunya mengandungi prinsip asas (asal) agama Islam yang penting
            untuk dihayati setiap Muslim.
          </p>
          <p className="text-base leading-relaxed text-gray-700 font-arabic-symbol">
            Setiap hadis dalam koleksi ini diambil daripada Sahih al-Bukhari,
            Sahih Muslim, dan kitab-kitab hadis utama yang lain. Tema yang
            dirangkumi termasuk niat dalam amalan, rukun Iman dan Islam, akhlak
            Muslim, hubungan dengan Allah SWT, halal dan haram, serta
            tanggungjawab sosial. Imam Nawawi memilih hadis-hadis ini kerana
            keluasan maknanya: para ulama menganggap setiap hadis sebagai
            &lsquo;satu pertiga&rsquo; atau &lsquo;separuh&rsquo; daripada
            agama Islam. Kerana keluasan inilah, Hadis 40 menjadi rujukan
            utama dalam pengajian agama Islam di Malaysia, termasuk kurikulum
            Kementerian Pendidikan Malaysia (KPM) dan sekolah-sekolah pondok.
          </p>
          <p className="text-base leading-relaxed text-gray-700 font-arabic-symbol">
            Setiap hadis di laman ini dilengkapi dengan teks Arab asal,
            terjemahan Bahasa Melayu, audio bacaan, dan pengajaran ringkas.
            Mulakan dengan senarai 42 tema utama di bawah, atau tatal ke
            bawah untuk membaca koleksi penuh.
          </p>
        </div>
        <aside aria-hidden className="bg-[repeating-linear-gradient(45deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed [--pattern-fg:#efefef]" />
      </section>

      {/* 42 Tema Utama jump grid */}
      <section className="grid lg:grid-cols-[1fr_auto_1fr] grid-cols-[1fr]">
        <aside aria-hidden className="bg-[repeating-linear-gradient(45deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed [--pattern-fg:#efefef]" />
        <div className="lg:w-4xl w-full bg-white py-12 px-4 sm:px-8 border-x-1 border-gray-200/50">
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
            42 Tema Utama
          </h2>
          <p className="text-sm text-gray-600 mb-8 font-arabic-symbol">
            Klik mana-mana hadis untuk membaca terjemahan penuh, audio bacaan,
            dan pengajaran pada halaman khusus.
          </p>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {hadiths.map((h) => (
              <li key={h.number}>
                <a
                  href={`/hadis40/${h.number}`}
                  className="block h-full p-4 border border-gray-200/70 hover:border-royal-blue hover:bg-royal-blue/5 transition-colors"
                >
                  <span className="font-mono text-xs text-royal-blue uppercase tracking-widest">
                    Hadis {String(h.number).padStart(2, '0')}
                  </span>
                  <span className="block mt-1 font-serif text-sm text-gray-900 leading-tight">
                    {h.hadith_title.ms}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </div>
        <aside aria-hidden className="bg-[repeating-linear-gradient(45deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed [--pattern-fg:#efefef]" />
      </section>

      {/* Teks Lengkap Hadis section header */}
      <section className="grid lg:grid-cols-[1fr_auto_1fr] grid-cols-[1fr]">
        <aside aria-hidden className="bg-[repeating-linear-gradient(45deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed [--pattern-fg:#efefef]" />
        <div className="lg:w-4xl w-full bg-white py-10 px-4 sm:px-8 border-x-1 border-gray-200/50">
          <h2 className="text-2xl font-serif font-bold text-gray-900">
            Teks Lengkap Hadis
          </h2>
          <p className="text-sm text-gray-600 mt-2 font-arabic-symbol">
            Senarai penuh 42 hadis dengan teks Arab asal, terjemahan Bahasa
            Melayu, audio bacaan, dan pengajaran setiap hadis.
          </p>
        </div>
        <aside aria-hidden className="bg-[repeating-linear-gradient(45deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed [--pattern-fg:#efefef]" />
      </section>

      {/* Items */}
      {hadiths.map((item) => (
        <div key={item.number}>
          <Hadis40Item
            item={item}
            mode="list"
            sources={sourcesByNumber[item.number]}
          />
        </div>
      ))}
    </main>
  )
}
