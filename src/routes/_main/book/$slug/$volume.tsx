import { createFileRoute, notFound, redirect } from '@tanstack/react-router'
import HadithContainer from '@/components/HadithContainer'
import {
  generateBreadcrumbSchema,
  generateCreativeWorkSchema,
} from '@/lib/structured-data'
import { AudioPlayerProvider } from '@/lib/AudioPlayerContext'
import { Toaster } from '@/components/ui/sonner'
import { fetchVolumePage } from '@/server/volume'

export const Route = createFileRoute('/_main/book/$slug/$volume')({
  loader: async ({ params }) => {
    const data = await fetchVolumePage({
      data: { slug: params.slug, volumeParam: params.volume },
    })
    if (!data) throw notFound()
    if (data.kind === 'redirect') {
      throw redirect({
        to: '/book/$slug/$volume',
        params: { slug: params.slug, volume: data.volumeSlug },
        statusCode: 301,
      })
    }
    const totalHadiths = data.view.chapters.reduce(
      (sum, c) => sum + c.hadiths.length,
      0,
    )
    if (data.view.chapters.length === 0 || totalHadiths === 0) {
      throw notFound()
    }
    return data
  },
  staleTime: 60 * 60 * 1000,
  preloadStaleTime: 60 * 60 * 1000,
  head: ({ loaderData, params }) => {
    if (!loaderData || loaderData.kind !== 'ok') {
      return { meta: [{ title: 'Volume not found' }] }
    }
    const { volume, book, totalCount } = loaderData
    const volumeUrl = `https://www.myway.my/book/${params.slug}/${params.volume}`
    const ogTitle = encodeURIComponent(volume.title_ms)
    const ogSubtitle = encodeURIComponent(book.title_ms)
    const ogImage = `https://www.myway.my/api/og?title=${ogTitle}&subtitle=${ogSubtitle}`
    const pageTitle = `${volume.title_ms} | ${book.title_ms}`
    const description = volume.title_ar
      ? `Koleksi ${totalCount} hadis dari ${volume.title_ms} (${volume.title_ar}) dalam ${book.title_ms}. Terjemahan Bahasa Malaysia dengan teks Arab asli.`
      : `Koleksi ${totalCount} hadis dari ${volume.title_ms} dalam ${book.title_ms}. Terjemahan Bahasa Malaysia dengan teks Arab asli.`
    return {
      meta: [
        { title: pageTitle },
        { name: 'description', content: description },
        { property: 'og:title', content: pageTitle },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: volumeUrl },
        { property: 'og:image', content: ogImage },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: pageTitle },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: ogImage },
      ],
      links: [{ rel: 'canonical', href: volumeUrl }],
    }
  },
  component: VolumePage,
})

function VolumePage() {
  const params = Route.useParams()
  const data = Route.useLoaderData()
  if (data.kind !== 'ok') return null

  const { book, volume, view, totalCount, surahs } = data
  const volumeUrl = `https://www.myway.my/book/${params.slug}/${params.volume}`

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://www.myway.my' },
    { name: 'Books', url: 'https://www.myway.my/books' },
    { name: book.title_ms, url: `https://www.myway.my/book/${params.slug}` },
    { name: volume.title_ms, url: volumeUrl },
  ])

  const creativeWorkSchema = generateCreativeWorkSchema({
    title: `${volume.title_ms} | ${book.title_ms}`,
    description: 'Koleksi hadis sahih dari Kutub Sittah',
    url: volumeUrl,
    image: `https://www.myway.my/api/og?title=${encodeURIComponent(volume.title_ms)}&subtitle=${encodeURIComponent(book.title_ms)}`,
    inLanguage: ['ms', 'ar'],
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(creativeWorkSchema) }}
      />
      <AudioPlayerProvider>
        <HadithContainer
          chapters={view.chapters}
          volumeFootnotes={view.volumeFootnotes}
          volume={volume}
          book={book}
          surahs={surahs}
          slug={params.slug}
          volumeParam={params.volume}
          totalCount={totalCount}
        />
      </AudioPlayerProvider>
      <Toaster />
    </>
  )
}
