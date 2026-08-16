# accordion

2026-08-16, transformation engine (legacy `new-york` style, wrapper pristine vs stock golden; no base-new-york counterpart so the project's own classes were kept and rewired). Verdict: clean.

## Changed

- `src/components/ui/accordion.tsx` — import switched from `@radix-ui/react-accordion` to `@base-ui/react/accordion`. Part renames: `Content` → `Panel`. Trigger open-state selector `[&[data-state=open]>svg]:rotate-180` → `[&[data-panel-open]>svg]:rotate-180` (Base UI's trigger uses `data-panel-open`, not `data-open`). Panel keeps `overflow-hidden text-sm` with `data-open:animate-accordion-down data-closed:animate-accordion-up`; the inner div (which keeps the user's `pb-4 pt-0`) gained `h-(--accordion-panel-height) data-starting-style:h-0 data-ending-style:h-0` per the base registry's animation placement. `forwardRef` boilerplate replaced with `Part.Props` function components.
- `src/styles.css:144,149` — accordion keyframes now read `--accordion-panel-height` (was `--radix-accordion-content-height`).
- `src/components/header.tsx:165` — `<Accordion type="single" collapsible>` → `<Accordion>`: Base UI single mode is the default (no `type` prop) and is always collapsible, so both props drop with identical behavior (the site had `collapsible` set).
- Leftover scan: `grep -n "radix-ui\|@radix-ui"` on accordion.tsx and styles.css → 0 hits.

## Left alone

- `src/components/ui/drawer.tsx` — vaul, not radix.

## Behavior changes

- `orientation`/arrow-key roving focus: Base UI removed roving arrow-key focus between accordion triggers per updated APG guidance. Tab/Shift-Tab still work. Not patched (no consumer relied on arrow keys).
- `value`/`onValueChange` are now always array-shaped. No consumer uses controlled value, so no call-site impact.

## Verify by hand

- Mobile drawer → "KUTUB SITTAH" accordion: opens/closes with the 0.2s height animation, chevron rotates 180° while open, and re-clicking the open item collapses it.
- Only one item exists; confirm no console warnings on open/close.
