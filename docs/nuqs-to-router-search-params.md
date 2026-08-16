# nuqs → TanStack Router Search Params: Conversion Notes

The Next.js app (myHadeethWeb) managed URL query state with [nuqs]
(`useQueryState`). This repo replaces it with TanStack Router's typed search
params (`validateSearch` + `useSearch` + `navigate`). The nuqs footprint in the
old app was small and is now fully retired:

| Old (nuqs)                       | New (router)                                  |
| -------------------------------- | --------------------------------------------- |
| `NuqsAdapter` in root layout     | (removed, not needed)                         |
| `SearchClient.tsx` (`/search`)   | `routes/_main/search.tsx` `validateSearch`    |
| `Pagination.tsx`                 | `getRouteApi("/_main/search")`                |
| `VolumeContainer.tsx` (`?q=`)    | `getRouteApi("/_main/book/$slug/")`           |

Future ports will not encounter nuqs again, but any new `?param` should follow
the rules below.

## 1. Always pass `resetScroll: false` for client-state params

Router navigations scroll to top by default. nuqs updated the URL without
touching scroll. Without this flag, typing in the volume filter yanked the
page to the top on every keystroke (found and fixed 2026-08-16).

```ts
navigate({
  to: ".",
  search: (prev) => ({ ...prev, q: value || undefined }),
  replace: true,
  resetScroll: false, // <- required for filter/typing-style params
})
```

Server-driven navigations (mode toggles, pagination links) can keep the
default scroll-to-top: that matches a "new page" mental model.

## 2. Keep client-only params OUT of `loaderDeps`

`loaderDeps` decides which search params refire the route loader.

- `/book/$slug`: `q` is deliberately **excluded**. Typing filters client-side
  and never hits the server.
- `/search`: `term` / `mode` / `page` / `books` are deliberately **included**.
  Changing them must re-run the search on the server.

Getting this wrong either hammers Turso on every keystroke or leaves a page
stale when its params change.

## 3. Numeric values: keep the schema `string | number`

The router's search serializer is JSON-based:

- Writing the **string** `"500"` produces `?q=%22500%22` (quoted to preserve
  the type on round-trip).
- Reading `?q=500` parses as the **number** `500`.

If `validateSearch` coerces to string, the router rewrites the URL to the
quoted form. The working pattern (see `/book/$slug`):

```ts
// validateSearch: accept both, do NOT coerce
q: (typeof search.q === "string" && search.q) || typeof search.q === "number"
  ? (search.q as string | number)
  : undefined

// write site: digit-only input goes out as a number -> clean ?q=500
q: value ? (/^\d+$/.test(value) ? Number(value) : value) : undefined

// read site: stringify at the consumer
const q = String(rawQ)
```

## 4. No write throttling (latent Safari risk)

nuqs throttled URL writes because Safari rate-limits `history.replaceState`
to roughly 100 calls per 30 seconds. Our per-keystroke `navigate` does not
throttle. Short queries are fine; if Safari ever logs `SecurityError` and the
filter URL stops updating, the fix is local input state plus a ~100ms
debounce before the navigate.

## 5. Converted components are route-coupled

`Pagination` and `VolumeContainer` pin their route via `getRouteApi(...)`;
the nuqs versions were route-agnostic. To reuse one on another route, pass
the values in as props or use `useSearch({ strict: false })` instead of
duplicating the pin.

## 6. URL encoding cosmetics

The router serializes spaces as `+` (`?term=puasa+ramadan`); the old app's
hand-built links produced `%20`. Identical after decoding, but:

- GSC / PostHog may report both variants as separate URLs.
- The parity crawler should normalize query strings before diffing against
  production.

## 7. Caching and SSR interactions

- `?q=` URLs share the route's `Cache-Control`, and CDNs key on the full URL,
  so each `q` variant caches separately at the edge. Harmless; an optional
  Cloudflare cache rule can ignore `q` in the cache key later.
- `?q=500` now SSRs pre-filtered. Production's `force-static` page always
  shipped unfiltered HTML and filtered after hydration. This is better UX and
  SEO-safe: the canonical strips `q`, so there is no duplicate-content risk.
