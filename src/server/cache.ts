// Cache-Control helper for server fns. `s-maxage` targets the Cloudflare CDN
// tier (the ISR replacement); browsers always revalidate (max-age=0) so a
// cache purge takes effect immediately for users. Applies to whichever
// response is in flight: the SSR document when the loader runs during SSR,
// or the server-fn RPC response during client navigation.
//
// This module is imported by server-fn files that also reach the client
// bundle, so the server-only import stays dynamic inside the function.

export const DAY_SECONDS = 86_400

export async function setCacheControl(
  sMaxAge: number,
  staleWhileRevalidate: number = DAY_SECONDS,
) {
  const { setResponseHeader } = await import('@tanstack/react-start/server')
  setResponseHeader(
    'Cache-Control',
    `public, max-age=0, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
  )
}
