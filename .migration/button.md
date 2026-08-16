# button

2026-08-16, transformation engine (legacy `new-york` style, wrapper pristine vs stock golden; no base-new-york counterpart exists so classes kept verbatim). Migrated to the real `@base-ui/react/button` primitive. Verdict: clean.

## Changed

- `src/components/ui/button.tsx` — `Slot`/`asChild` idiom replaced with `ButtonPrimitive` from `@base-ui/react/button`, which supports `render` natively. All cva variant classes kept byte-identical. `ButtonProps` is now `ButtonPrimitive.Props & VariantProps<typeof buttonVariants>` (the `asChild?: boolean` member is gone; `render` replaces it). `React.forwardRef` dropped — the primitive forwards refs itself.
- `src/components/header.tsx:284` — the login button's `asChild` + `<a>` child became `render={<a href="/login" />}` with `MASUK` as children.
- Leftover scan: `grep -n "radix-ui\|@radix-ui\|IconPlaceholder" src/components/ui/button.tsx` → 0 hits.

## Left alone

- `src/components/Card.tsx`, `src/components/TrackedIntroButton.tsx` — consume `Button` with plain props only (no `asChild`), no changes needed.
- `src/components/ui/drawer.tsx` — vaul, not radix; out of scope by hard rule.

## Behavior changes

- None expected. Base UI's Button emits the same `<button>` element; `disabled:` Tailwind variants remain valid.

## Verify by hand

- Desktop nav, signed out: the MASUK button renders as a styled `<a href="/login">` and navigates on click.
- Book cards ("LIHAT"/"GUNAKAN") and the mobile drawer trigger button still render with correct variant styling and hover states.
