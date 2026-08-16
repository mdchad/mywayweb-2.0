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

- **Legacy style caveat (not fixed, by design)**: `components.json` still reads `"style": "new-york"`, `"base": "radix"`. There is no `base-new-york` registry style, so the config was NOT flipped. Future `shadcn add <component>` will deliver **radix** variants; either add new components by hand against Base UI, or switch the project to a `base-<style>` (which would restyle the app).
- Behavior deltas are listed per component; the notable ones are the navigation-menu popup now anchoring to the trigger (portal-rendered, 50ms hover delay) and accordion losing arrow-key roving focus.

## Status

0 wrappers remain on Radix (ui directory scan: accordion, button, navigation-menu on `@base-ui/react`; drawer on vaul by hard rule).
