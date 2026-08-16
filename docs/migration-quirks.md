# Migration Quirks: Next.js (Vercel) → TanStack Start (Cloudflare)

Everything in the port that was NOT a 1:1 mechanical change. Each entry:
what changed, why it couldn't be copied as-is, and the rule going forward.
Companion doc: [nuqs-to-router-search-params.md](./nuqs-to-router-search-params.md).

---

## Data fetching and server functions

### RSC direct DB access → `createServerFn`

Server components used to call `lib/queries/*` directly. Here, routes call
server functions in `src/server/` (one file per domain: `books.ts`,
`hadis40.ts`, `book.ts`, `search.ts`, `today.ts`) and the query layer is
imported **dynamically inside the handler** so kysely/@libsql never reach the
client bundle:

```ts
export const fetchBooksList = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getBooksForList } = await import("@/lib/queries/books")
    ...
  },
)
```

Rules:
- Server-only modules (`cloudflare:workers`, `@tanstack/react-start/server`,
  query layer) are only imported dynamically inside handlers.
- Input validation via `.inputValidator(zodSchema)`.

### Loader payloads are user-facing (RSC's were not)

RSC rendered data to HTML on the server; loaders serialize their return value
into the page and ship it to the browser. Overfetching is now a real cost.

- Wire shapes live in the query layer: `getBooksForList()` (no
  `mongo_id`/timestamps), `getAllHadis40ForList()` (ms/ar only, no `en`, no
  footnotes). No `selectAll` in anything a loader returns.
- The serializer **rejects `unknown`-typed values** (hadith40 `footnotes` had
  to be dropped) and Maps are flattened to plain records before returning.
- Measured reality check: the loader stream is ~98KB of the 530KB dev
  `/hadis40` page, and the port's page is ~30% lighter than prod's 771KB
  (Next's RSC flight payload was heavier than Start's loader JSON).

### `notFound()`

`next/navigation`'s `notFound()` becomes `throw notFound()` (from
`@tanstack/react-router`) inside the route loader. See `/book/$slug`.

---

## Caching: ISR is gone

Next's `revalidate = N` + `revalidatePath()` have no equivalent. The
replacement is CDN caching plus (later) purge-on-update:

- Every content server fn sets `Cache-Control: public, max-age=0,
  s-maxage=N, stale-while-revalidate=86400` via `src/server/cache.ts`
  (`setCacheControl`). Home = 3600, content pages = 86400.
- `max-age=0` means browsers always revalidate, so a future purge reaches
  users immediately. Purge wiring (admin save / daily cron calling the
  Cloudflare purge API) is still TODO at cutover.
- Client side: the router scaffold sets `defaultPreloadStaleTime: 0`, which
  refires loaders on every link hover. Every content route therefore sets
  `staleTime` + `preloadStaleTime` (1h) explicitly.
- `force-static` + `generateStaticParams` pages (`/book/$slug`) are now SSR
  behind the same day cache. True build-time prerendering is available in
  Start but deferred: it trades instant admin updates for rebuilds.

Note: `setResponseHeaders` (plural) wants a `Headers` instance; use the
singular `setResponseHeader(name, value)`.

---

## KV: @vercel/kv → Workers KV

`src/lib/kv.ts` wraps the KV binding with the `@vercel/kv` surface
(`get`/`set` with `{ ex }`) so copied lib code only changes an import. Not
1:1 underneath:

- Values are JSON strings (matches what @vercel/kv did implicitly).
- Workers KV enforces a **60s minimum TTL** (wrapper clamps).
- Workers KV is **eventually consistent** (up to ~60s cross-edge). Fine for
  the three current uses (daily hadith preview, warming cursor, embedding
  cache); never use it for anything transactional.
- Missing binding degrades to `null`/no-op instead of throwing: KV is
  best-effort everywhere it's used.
- The binding is read via dynamic `import("cloudflare:workers")` inside
  server fns.
- **Local dev**: the miniflare KV namespace starts empty. Seed it:
  `wrangler kv key put todayHadithPreview --binding=KV --local --path=<json>`
  (fetching from prod as a fallback does not work, see "Vercel bot gate").
- Before first deploy: `wrangler kv namespace create KV` and replace the
  placeholder id in `wrangler.jsonc`.

---

## Fonts: next/font behaviors do not carry over

Three invisible things next/font did that plain `@font-face` does not:

1. **Feature stripping**: the old app declares
   `font-feature-settings: "cv02","cv03","cv04","cv11","salt"`, but its
   Google-built Inter had those OpenType features stripped, so they never
   rendered. Our self-hosted rsms InterVariable honors them (single-storey
   "a" etc.), which changed letterforms site-wide. The declaration is
   omitted to match production. Re-adding it is a deliberate design decision
   for after cutover.
2. **Auto fallback fonts**: next/font injected Arial-adjusted fallbacks. The
   Arabic faces (KFGQPC Arabic Symbols, SurahNames, Fantezy) have little or
   no Latin coverage, so the theme vars must list explicit
   `Arial, ui-sans-serif, ...` fallbacks or Latin text falls to Times.
3. **Hashed family names**: prod's `:root { font-family: Inter }` never
   actually matched next/font's loaded font; here `InterVariable` genuinely
   resolves. Verify typography **visually** against prod, not just via
   computed `font-family`.

---

## Head/SEO: TanStack head accumulates, Next metadata replaces

Next's per-page `metadata` replaced root-layout values. TanStack `head()`
**merges/accumulates** down the route tree. Consequence found in the wild: a
root-level default canonical stacked with page canonicals (two canonical
tags on `/books`).

Rules:
- No default canonical in `__root.tsx`. **Every route sets its own** in
  `head()`.
- JSON-LD stays as inline `<script type="application/ld+json">` in
  components (same as prod).
- GA is a plain gtag script in the root head (was `@next/third-parties`).

---

## UI components: Base UI base with prod styling

The repo uses shadcn's Base UI base (`"base"` in components.json, base-nova
registry). Radix was removed. Quirks:

- **base-nova restyles components.** Stock registry files carry the new
  "nova" design (different radii, rings, blurred dialog backdrops, top-third
  command palette). Anything the old app visually customized must keep
  **Base UI primitives + the old app's class strings**. Done for
  `ui/command.tsx` (centered max-w-lg palette, `bg-black/80` backdrop, h-16
  borderless input, no animations). Stock-styled components (skeleton,
  future admin tables) can stay pure base-nova.
- **`ui/button.tsx` keeps the old prod styling** on a Base UI
  implementation. `shadcn add --overwrite` will try to clobber it (dialog
  depends on button): back it up first.
- base-nova stock referenced a `size="icon-sm"` button variant that our
  button doesn't have (patched to `size="icon"` in dialog.tsx).
- Base UI's `Root.Props["children"]` is `ReactNode | render-function`; when
  wrapping, `Omit` children and redeclare as `ReactNode`.
- The drawer (vaul) and navigation-menu survived the migration but deserve
  an eyeball check against prod at some point.

---

## Removed/replaced app infrastructure

| Old | New | Notes |
| --- | --- | --- |
| nuqs | typed search params | see companion doc |
| react-query (search page) | route loader + `staleTime` | loading UI via `pendingComponent` |
| `Suspense` page fallbacks | `pendingComponent` + `pendingMs`/`pendingMinMs` | search skeletons |
| `next/image` | plain `<img>` | all images are local logos; `fetchPriority`/`loading` set manually; no optimizer |
| `next/link` | typed `<Link to>` | unported targets stay `<a>` (full page load) until their route lands, then get flipped |
| `next/font` | self-hosted `@font-face` | see Fonts |
| Better Auth client | stub in `src/lib/auth-client.ts` | navbar renders signed-out; real client returns with the auth port |
| PostHog via `/ingest` rewrite proxy | direct `posthog-js` with `VITE_POSTHOG_KEY` | reverse-proxy route still TODO; placeholder key in template `.env.local` causes 404/401 console noise |
| `maxDuration` / `runtime` route exports | (dropped) | meaningless on Workers |

---

## Platform / runtime

- **`process.env` works in workerd** (nodejs_compat populates it from
  bindings/.env.local in dev), so `lib/turso.ts` ported unchanged. Wrangler
  secrets provide it in production.
- Bare `'crypto'` imports become `'node:crypto'` (semantic-search).
- `@libsql/client` resolves its web build via the `workerd` export
  condition: no code change needed.
- Server bundle is ~135KB gzip: Workers free-plan size limits are a
  non-issue on this stack.

---

## Dev workflow gotchas

- **Vercel bot gate**: production serves a challenge page to server-to-server
  fetches (`/api/today`) and 429s scripted page fetches. Dev fallbacks that
  fetch prod do not work (seed local KV instead), and prod comparisons must
  use a real browser.
- The template's `build` script had a stale Nitro-era `cp .output` step
  (fixed to plain `vite build`).
- Dev server ports drift (3000/3001/3002) depending on what else is running;
  check the vite banner.
- Mobile app contract: `/api/*` routes (UA gating, update-required payloads,
  dual shapes) are NOT ported yet. Mobile keeps hitting the old app until
  the API-port phase, which should be gated on converting the old repo's 120
  contract tests to black-box HTTP form first.

---

## Addendum: hadith volume page port (2026-08-16)

- **`asChild` compat shims**: `ui/button.tsx`, `ui/tooltip.tsx` (Trigger) and
  `ui/sheet.tsx` (Trigger) accept Radix-era `asChild` by lifting the single
  child element into Base UI's `render` prop. Two subtleties: Base UI
  populates the rendered element's children from the *component's* children
  (so the shim forwards the child element's own children), and native
  `render={<a />}` + children usage must pass through untouched. Ported code
  keeps its `asChild` call sites unchanged.
- **Base UI tooltip provider prop is `delay`, not `delayDuration`.**
- **Duplicate-React crash after mid-session installs**: adding packages while
  `vite dev` runs can leave stale dep-optimization state (symptom:
  `Cannot read properties of null (reading 'useContext'/'useMemo')` in SSR or
  hooks). Fix: kill dev server, `rm -rf node_modules/.vite`, restart.
- **`inputValidator` is deprecated in the current Start version** (warns at
  dev time); switch server fns to `.validator()` in a cleanup pass.
- The sidenote-alignment engine, audio player, reading settings and Lexical
  renderer ported verbatim (all client-side; no framework coupling). Layout
  parity was verified by anchoring the same hadith on prod and port: both
  land at the identical scrollY.
- **AIChat is a stub** (`src/components/AIChat.tsx`): the per-hadith "Tanya
  AI" drawer shows a placeholder until the /chat port lands (needs
  ai-elements suite + /api/chat streaming backend).
