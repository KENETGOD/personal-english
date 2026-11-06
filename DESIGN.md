# English Coach design system

Warm and tactile like a gamified learning app, but quieter: one typeface, one confident green, flat surfaces, color only where it carries meaning. UI copy is neutral professional Spanish; code and comments are English.

## Principles

1. **Minimal first.** Whitespace over decoration. No mascots, no illustration clutter, no shadows for depth (only the pressable edge).
2. **Color carries meaning.** Green = action/success, amber = streak/motivation, mode tints = which practice mode, red = error. Nothing else is colored.
3. **Tactile.** Primary actions are chunky and pressable. Rounded shapes, 2px borders.
4. **Accessible by construction.** WCAG 2.2 AA in both themes, enforced by `npm run check:contrast`.
5. **Mobile-first.** Design at 360px, then widen. Respect safe-area insets and `prefers-reduced-motion`.

## Tokens

All tokens live in `app/globals.css` on `:root` as `light-dark(light, dark)` (oklch). Dark follows `prefers-color-scheme`; `.dark` / `.light` classes force a theme. Tailwind classes: `bg-primary`, `text-primary-shade`, `bg-mode-reading`, ...

| Token                                                            | Purpose                                                     |
| ---------------------------------------------------------------- | ----------------------------------------------------------- |
| `background` / `foreground`                                      | Page surface (warm near-white / deep ink) and body text     |
| `card` / `card-foreground`                                       | Cards, inputs, tab bar. White, 2px `border`, no shadow      |
| `muted` / `muted-foreground`                                     | Quiet surfaces; secondary text (14px helper copy)           |
| `primary` / `primary-foreground`                                 | Leaf green fill with dark green ink (AA; never white on it) |
| `primary-shade`                                                  | Pressable bottom edge and green text on light surfaces      |
| `accent` / `accent-foreground`                                   | Soft green tint: selected chip, active nav, success note    |
| `streak` / `-foreground` / `-shade`                              | Flame amber. Streak and motivation elements only            |
| `mode-{vocabulary,reading,writing,speaking,mix}` + `-foreground` | Soft tint + strong text per mode (below)                    |
| `destructive` / `-foreground` / `-shade`                         | Errors, destructive actions. Error text uses `destructive`  |
| `border`                                                         | Decorative 2px card/divider border                          |
| `input`                                                          | Control boundary, >= 3:1 against surface                    |
| `ring`                                                           | Focus ring, >= 3:1                                          |
| `--radius` (14px), `rounded-card` (16px)                         | Buttons/inputs vs cards                                     |

Success feedback reuses `accent`/`primary`; there is no separate success hue.

## Typography

Nunito (variable) via `next/font/google`, exposed as `--font-nunito` / `font-sans`. Tight tracking on headings only.

| Role          | Class          | Spec                        |
| ------------- | -------------- | --------------------------- |
| Screen title  | `text-display` | 32/36, extrabold, -0.02em   |
| Section title | `text-section` | 20/28, bold                 |
| Body          | `text-base`    | 16                          |
| Small / muted | `text-sm`      | 14, `text-muted-foreground` |

Buttons and labels are sentence case, never uppercase.

## Buttons

`components/ui/button.tsx`. Face + 4px bottom edge via `box-shadow`; on `:active` it translates 3px and the edge shrinks to 1px (no layout shift).

- `default` green with `primary-shade` edge; `secondary` card with 2px border and gray edge; `destructive` red; `ghost` and `link` are flat.
- Sizes: `default` h-48 full width, `lg` h-56, `sm` h-40 auto width (toolbars), `icon`.
- One primary button per screen section. Forms are full width on mobile.

## Inputs and choices

- `Input`: 48px, `border-2 border-input`, radius 14, focus = `ring` border + 4px soft ring, `aria-invalid` = destructive border and ring.
- Always pair with a `Label` (bold 14px). Hints are `text-sm text-muted-foreground`, linked via `aria-describedby`.
- `ChoiceChip` (`components/ui/choice-chip.tsx`): segmented control for short fixed sets (radio) and multi-pick topics (checkbox). Keeps native form fields.

## Mode colors

| Mode       | Hue          | Token             |
| ---------- | ------------ | ----------------- |
| Vocabulary | violet       | `mode-vocabulary` |
| Reading    | sky          | `mode-reading`    |
| Writing    | amber-yellow | `mode-writing`    |
| Speaking   | coral        | `mode-speaking`   |
| Mix        | green        | `mode-mix`        |

Use as `bg-mode-x text-mode-x-foreground` on a flat card. Do not use mode tints for anything but their mode.

## Layout

- Public screens: single centered column, max 26rem, logo on top; bordered card from `sm`.
- App shell (`app/(app)/layout.tsx`): sticky top bar (logo, logout), `AppNav` as bottom tab bar below `lg` and left sidebar from `lg` (same items, one DOM node). Content max 40rem, 16px gutters, bottom padding clears the tab bar; use `env(safe-area-inset-*)`.
- Add nav items only for routes that exist (`components/app/app-nav.tsx`).
- Motion 150-200ms; global reduced-motion rule in `globals.css` disables it.

## Do / Don't

- Do use tokens and `rounded-card`/`rounded-lg`; don't hardcode hex or oklch in components.
- Do add new color pairs to `scripts/check-contrast.mjs` when adding tokens.
- Do keep one typeface and two heading sizes; don't add font weights beyond 400-800.
- Don't put white text on `primary`; use `primary-foreground`.
- Don't use shadows for elevation, gradients, or decorative color.
- Don't change accessible names (labels, button text) without updating `tests/e2e`.
