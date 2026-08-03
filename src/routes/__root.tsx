import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import PostHogProvider from '../integrations/posthog/provider'
import {
  generateOrganizationSchema,
  generateWebsiteSchema,
} from '@/lib/structured-data'

import appCss from '../styles.css?url'

const SITE_DESCRIPTION =
  "Koleksi hadis sahih Bahasa Melayu dari Kutub Sittah: Sahih al-Bukhari, Sahih Muslim, Sunan Abu Dawud, Jami' Al-Tirmidhi, Sunan Al-Nasa'i, Sunan Ibn Majah."

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'My Way | Koleksi Hadis Sahih' },
      { name: 'description', content: SITE_DESCRIPTION },
      { property: 'og:site_name', content: 'My Way | Koleksi Hadis Sahih' },
      { property: 'og:title', content: 'My Way | Koleksi Hadis Sahih' },
      { property: 'og:description', content: SITE_DESCRIPTION },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'canonical', href: 'https://www.myway.my' },
      { rel: 'icon', href: '/icon.ico', sizes: 'any' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/site.webmanifest' },
      {
        rel: 'preload',
        href: '/fonts/Inter-roman.var.woff2',
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'preload',
        href: '/fonts/KFGQPC-Regular.ttf',
        as: 'font',
        type: 'font/ttf',
        crossOrigin: 'anonymous',
      },
    ],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify(generateOrganizationSchema()),
      },
      {
        type: 'application/ld+json',
        children: JSON.stringify(generateWebsiteSchema()),
      },
      // Google Analytics (was @next/third-parties GoogleAnalytics)
      {
        src: 'https://www.googletagmanager.com/gtag/js?id=G-754T3ZNMKN',
        async: true,
      },
      {
        children: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-754T3ZNMKN');`,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ms">
      <head>
        <HeadContent />
      </head>
      <body>
        <PostHogProvider>
          {children}
          {import.meta.env.DEV && (
            <TanStackDevtools
              config={{
                position: 'bottom-right',
              }}
              plugins={[
                {
                  name: 'Tanstack Router',
                  render: <TanStackRouterDevtoolsPanel />,
                },
              ]}
            />
          )}
        </PostHogProvider>
        <Scripts />
      </body>
    </html>
  )
}
