# project (whole-project radix → base-ui migration)

2026-08-16, branch `migrate-base-ui`, one commit per component (button → accordion → navigation-menu → dependency removal).

## Dependency swap

- Added `@base-ui/react@1.7.0` (bun).
- Removed direct deps: `@radix-ui/react-accordion`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-slot`.
- `bun.lock` still contains `@radix-ui/*` entries — these are **transitive deps of vaul** (drawer, built on radix dialog), which is intentionally untouched. No direct radix dependency remains in `package.json`.

## App-code sweep

Swept `src/` (outside `components/ui`) for `asChild`, `data-[state=...]`, `delayDuration`, and radix imports:

- `src/components/header.tsx` — all call sites fixed (Button render, Accordion type/collapsible, NavigationMenuTrigger classes, NavigationMenuLink render + closeOnClick). Details repeated in each component's report.
- Remaining `asChild` at `header.tsx:220` is on vaul's `DrawerTrigger` — correct, vaul keeps radix-style API.
- `src/components/Card.tsx`, `src/components/TrackedIntroButton.tsx` — plain Button props, no changes needed.
- `src/styles.css` — accordion keyframes moved to `--accordion-panel-height`.

## Final build

- Baseline before migration: `tsc --noEmit` clean.
- After migration: `tsc --noEmit` clean, `vite build` succeeds (407ms, no warnings attributable to the migration).
- Leftover scan across all migrated files: 0 radix references.

## Flags

- **Legacy style caveat — RESOLVED 2026-08-16**: `components.json` was flipped from `"style": "new-york"` to `"style": "base-nova"` at the user's request (commit `d339527`). The CLI now resolves `base: base`, and future `shadcn add <component>` delivers Base UI variants (verified: `base-nova/tooltip` imports `@base-ui/react/tooltip`). Existing wrappers are untouched by the flip; newly added components arrive in the base-nova look and should have their classes adjusted to the site's design. Do not run `add --overwrite` on existing components — it would restyle them.
- Behavior deltas are listed per component; the notable ones are the navigation-menu popup now anchoring to the trigger (portal-rendered, 50ms hover delay) and accordion losing arrow-key roving focus.

## Status

0 wrappers remain on Radix (ui directory scan: accordion, button, navigation-menu on `@base-ui/react`; drawer on vaul by hard rule).
