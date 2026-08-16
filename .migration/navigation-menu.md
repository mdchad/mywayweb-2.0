# navigation-menu

2026-08-16, transformation engine with the base registry (`base-nova`) used as an anatomy reference only — legacy `new-york` style, so the project's own classes were carried over, not restyled. Verdict: clean build; positioning model changed (see behavior changes).

## Changed

- `src/components/ui/navigation-menu.tsx` — rewired to `@base-ui/react/navigation-menu`:
  - Root keeps its classes and still auto-renders the shared popup, now via `<NavigationMenuPositioner />`.
  - `NavigationMenuViewport` (a `div` + `Primitive.Viewport` under the list) was replaced by `NavigationMenuPositioner`: `Portal > Positioner > Popup > Viewport`. The old viewport's visual classes (`rounded-md border bg-popover text-popover-foreground shadow`, `h-[var(--radix-navigation-menu-viewport-height)]` / `md:w-[var(...-viewport-width)]`) moved onto Popup as `h-(--popup-height)` / `md:w-(--popup-width)`; `zoom-in-90/zoom-out-95` keyframe idiom restated as `data-starting-style:scale-90` / `data-ending-style:scale-95` transitions. Positioner gets `isolate z-50` + size vars and forwards `side/sideOffset/align/alignOffset` explicitly (`sideOffset={6}` replaces the old `mt-1.5`; `align="center"` approximates radix's centered viewport).
  - Trigger: `data-[state=open]:*` → `data-popup-open:*` in `navigationMenuTriggerStyle`; chevron `group-data-[state=open]:rotate-180` → `group-data-popup-open:rotate-180`.
  - Content: radix `data-[motion=...]` animate-in/out classes restated as `data-starting-style`/`data-ending-style` + `data-[activation-direction=left|right]` translate transitions; kept `w-full md:w-auto` (the `left-0 top-0 md:absolute` positioning is now the Positioner's job).
  - Indicator: maps to `NavigationMenuPrimitive.Icon` per the ground-truth mapping; dead radix `data-[state=visible|hidden]` animation classes removed (Base UI's Icon never emits them). Kept the same export name; note the role differs (see behavior changes).
  - Exports: `NavigationMenuViewport` replaced by `NavigationMenuPositioner` (no consumer imported the old name).
- `src/components/header.tsx`:
  - `header.tsx:81` trigger className: `data-[state=open]:*` → `data-popup-open:*` (4 classes).
  - `header.tsx:88,105` both `NavigationMenuLink asChild` call sites → `render={<a …/>}` / `render={<Link to="/books" />}` with children/className hoisted onto the Link part; added `closeOnClick` for radix parity (Radix closed the menu on link select by default; Base UI defaults to leaving it open).
- Leftover scan: `grep -n "radix-ui\|@radix-ui\|IconPlaceholder"` on navigation-menu.tsx and header.tsx → 0 hits.

## Left alone

- `src/components/ui/drawer.tsx` and its header usage — vaul, not radix; intentionally untouched.

## Behavior changes

- **Popup anchoring**: radix rendered the viewport centered under the whole menu bar; Base UI anchors the popup to the active trigger with real collision-aware positioning (`side="bottom" align="center"`). With the single "KUTUB SITTAH" trigger the popup now centers under that trigger instead of the nav root, and it renders in a portal at the body (was inline inside the nav).
- **Hover-open delay**: radix `delayDuration` default 200ms → Base UI `delay` default 50ms; menus open faster on hover. Flagged, not patched (idiomatic Base UI default).
- **Indicator**: `NavigationMenuIndicator` now renders Base UI's `Icon` (a per-trigger chevron slot marker), not a list-tracking arrow — Base UI has no part that tracks the active trigger along the list. Unused in this app.
- `skipDelayDuration` and the `viewport` boolean no longer exist (unused here).

## Verify by hand

- Desktop nav: hover/click "KUTUB SITTAH" — popup opens under the trigger with border/shadow, scales in, chevron rotates.
- Keyboard: Tab to the trigger, Enter opens, arrow keys move through the six book links, Escape closes and returns focus to the trigger.
- Click "Sahih al-Bukhari" (plain `<a>`) and "Lihat Semua Koleksi" (router `Link`): both navigate and the menu closes on click.
- Resize below `md`: popup width falls back to `w-full` of the positioner.
