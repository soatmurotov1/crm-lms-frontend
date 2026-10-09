# App shell and design-system board

Status: approved direction (all decisions below confirmed by the product owner on 2026-10-07), implementation specification
Date: 2026-10-07

The Decisions, Surface policy, Page archetypes, and Loop contract sections supersede any conflicting statement elsewhere in this file.

## Objective

Make the Auto Maktab desktop UI use the available viewport instead of reading as a centered box, make the collapsed desktop sidebar icon-only, migrate the frontend and Storybook to a unified deep-slate/technology-blue semantic theme, and ship one design-system documentation board in both Storybook and an owner/dev-only product route.

## Success criteria

1. Normal authenticated pages have no centered `max-w-screen-2xl` cap and use minimal adaptive outer gutters.
2. The fleet-map full-bleed exception remains unchanged.
3. Expanded desktop navigation remains labeled. Collapsed desktop navigation is a 56px icon rail (44px-tall hit areas) with no visible item or section text; accessible names, titles/tooltips, active state, flyouts, keyboard operation, mobile navigation, account affordance, and onboarding behavior remain functional.
4. The frontend and Storybook use one semantic token system: deep gray/slate surfaces, technology-blue primary/ring, and distinct success/warning/error/info roles. Manrope and JetBrains Mono remain the product fonts.
5. A shared `DesignSystemBoard` renders in Storybook and at `/design-system` without duplicating content or styling.
6. `/design-system` is protected by the existing `manageUsers` capability and appears in the System navigation only to users with that capability.
7. The board contains DS-00 through DS-05, clear dividers and large headings, high-contrast typography, responsive grids, and real production primitives in relevant states.
8. Lint, typecheck, focused tests, production build, Storybook build, desktop browser verification, and mobile browser verification pass.

## Non-goals

- Do not change business workflows, API calls, backend contracts, translations outside the new navigation/page copy, route behavior unrelated to `/design-system`, or the fleet-map layout.
- Do not replace the existing component library, icon family, routing library, Storybook, or font files.
- Do not modify the shared `@autodrive/design-tokens` package; this task is scoped to `autodrive-frontend`, whose unlayered token overrides are already authoritative.
- Do not add a second token runtime, theme provider, CSS-in-JS system, or generated token pipeline.

## Decisions (grilling, 2026-10-07)

1. **Direction.** Deep slate surfaces plus a technology-blue primary for the app and Storybook. Amber becomes the `warning` role only. Manrope and JetBrains Mono stay. The earlier "Road Signal" teal/amber direction and the amber `Design.md` are superseded.
2. **One surface rule.** See Surface policy. Legacy surface components merge into `Card`, `StatCard`, and `DataCard`.
3. **Collapsed rail is 56px**, not 72px. Rail hit areas are 44px tall. The content area gains width.
4. **Theme.** The app keeps following the system preference. Storybook and the `/design-system` board default to dark. Both themes pass WCAG AA text contrast, enforced by a test.
5. **Enforcement.** `scripts/check-design-system.mjs` (ratchet baseline) runs in CI from wave 1.
6. **Scope and delivery.** `autodrive-frontend` only. Waves 0-5 on branch `feat/design-system-unification`, one commit per wave. No push or PR without an explicit instruction.

## Surface policy (the single flow)

Layers: `canvas` (`--background`) -> app chrome (`--surface`: sidebar, topbar) -> `card` (`--card`, one level only) -> overlays (popover, dialog, sheet, toast).

Primitives (the only bordered content surfaces):

- `Card` with `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
- `StatCard`: one KPI (label 12px muted, value 24px/700 tabular-nums, optional delta and sub-line). A group of KPIs is a `grid gap-3` of `StatCard`s. It replaces both `KpiCard` definitions, `SummaryCard`, and `DashboardCard`.
- `DataCard`: the mobile row variant of a table row, using the same tokens.
- Domain cards (`LeadCard`, `LessonCard`, `DefectCard`, mobile list cards) compose these; they never define their own surface classes.

Rules:

- S1. Only `Card`, `StatCard`, and `DataCard` draw a bordered surface. No raw element combines `bg-card`, `border`, and `rounded`. The `glass-card` and `glass*` classes are removed.
- S2. No card inside a card. Group inside a card with dividers (`divide-y`, `border-t`) or an unbordered inset (`bg-muted/40 rounded-md`).
- S3. Card: 8px radius (`rounded-lg`), 1px `border-border`, no shadow, padding `p-4` (`p-3` when dense). Header: title 16px/600 with an optional 13px muted description on the left, actions on the right.
- S4. Radius scale: 6px controls (`rounded-md`), 8px cards (`rounded-lg`), 12px dialogs and sheets (`rounded-xl`). `rounded-full` only for avatars, badges, and switches. No `rounded-2xl` or larger.
- S5. Elevation: none on in-page surfaces. Overlays use one overlay shadow token.
- S6. Borders: `border-border` only. Hover and selected states use `bg-muted/40` or `bg-accent`, never a tinted border; focus uses the ring.
- S7. Tables and lists: one Card per table, `overflow-hidden`, table edge to edge. Below `md`, rows render as `DataCard`s.
- S8. Empty, loading, and error states render inside the Card through `EmptyState` and `Skeleton`.
- S9. Rhythm: 16px (`space-y-4`) between page-level blocks, 12px (`gap-3`) in card grids, 8px/12px outer gutters.
- S10. Status is never color-only: pair color with an icon or text.

## Page archetypes

- **A1 List page:** `PageHeader` -> filter row (`ListSearchField` plus filters) -> `Card` holding the table or `DataGrid` -> `PaginationControls`.
- **A2 Detail page:** `EntityDetailShell` (back and header) -> optional `StatCard` row -> `Tabs` -> `Card` sections (`lg:grid-cols-2`).
- **A3 Dashboard:** `PageHeader` -> filter row -> three primary `StatCard`s -> attention band (two Cards) -> analysis Cards -> collapsible details.
- **A4 Form or dialog:** `Dialog` (12px radius) with header, body, footer. Sections are separated by dividers. The primary action sits on the right, a destructive action on the left.
- **A5 Settings or profile:** stacked `Card`s with headers. A single-column form may use a left-aligned `max-w-3xl`; never centered.
- **A6 Exceptions:** the fleet map (full bleed) and Login/NotFound (standalone layouts).

Every authenticated list and detail page follows A1 or A2.

## Loop contract (waves 0-5)

Each wave is a servo loop: Plan (this spec plus the wave scope) -> Build (one implementer) -> Judge (independent) -> fix. At most 3 fix rounds, then escalate to the product owner. Waves: 0 tokens, board, route; 1 primitives and ratchet script; 2 list pages; 3 detail pages; 4 dashboards; 5 forms, dialogs, settings.

Done criterion, checked by the orchestrator and never by the implementer:

- G1. `pnpm typecheck` exits 0.
- G2. `pnpm exec eslint --max-warnings=0 <changed files>` exits 0.
- G3. Full `vitest run` is green. The test count never decreases; no `.skip` or `.only`; no assertion is removed without a replacement.
- G4. `pnpm build` exits 0. Waves 0 and 5 also run `pnpm build-storybook`.
- G5. From wave 1: `node scripts/check-design-system.mjs` reports zero violations in the wave scope, and repo-wide counts never exceed `scripts/design-system-baseline.json`.
- G6. From wave 0: the token contrast test passes (every foreground/background pair at least 4.5:1 in light and dark).
- G7. Two independent adversarial reviewers report no unresolved finding.
- G8. Browser evidence: each changed page at 1440 and 390 widths, uz locale, light and dark, captured by the orchestrator.

Boundaries, the things that must not happen:

- B1. No change to API calls, business logic, RBAC, route behavior, or translations outside new design-system labels.
- B2. No deleted or weakened tests, no new `eslint-disable`; the check script and baseline only ever get stricter.
- B3. No new dependency; `@autodrive/design-tokens` and other repositories stay untouched.
- B4. The implementer never edits acceptance conditions (G rules, baseline numbers upward, this spec).
- B5. An unclear requirement stops the implementer and returns a question; it must not guess.
- B6. No push, PR, or merge. The product owner flips the last switch.

Reconciliation anchors, measured 2026-10-07 before wave 1: 159 card-like surfaces (94 `glass-card`, 64 `bg-card`), 4 radii, 5 shadows, 4 paddings, 7 legacy card definitions, about 50 raw bordered divs, 14 `max-w` caps, 16 pages with their own header markup.

## Design direction

### Scene

Owners and operators use the app for long, information-dense work sessions on desktop displays. Low-glare slate surfaces reduce visual fatigue; blue is reserved for active navigation, primary actions, focus, and selected controls.

### Palette

The CSS custom properties in `src/index.css` remain the runtime source of truth.

Primitive families:

- Slate 50–950: cool neutral text, borders, canvas, surface, card, elevated surface.
- Blue 50–900: restrained brand and interaction scale centered on blue 500/600.
- Green, amber, red, and cyan: semantic success, warning, destructive, and information roles only.

Dark semantic mapping:

- Canvas: near-black slate.
- Surface/sidebar: slate 900.
- Card/popover: elevated slate 800/900.
- Border/input/hairline: low-contrast slate 700/800.
- Primary and ring: blue 400/500 with dark ink where contrast permits.
- Foreground: slate 50; muted foreground: slate 300/400.

Light mode remains supported with the same blue brand family and accessible slate neutrals. Storybook defaults to dark because the documentation board is specified as a dark artifact.

### Typography

- Manrope: interface, headings, labels, body.
- JetBrains Mono: token names, values, dates, codes, and numerical examples.
- Board scale: caption 12, label 13, body 14/16, title 20/24, section header 32, board title 44–48 responsive.
- Product pages keep their existing type hierarchy unless a token mapping changes it automatically.

### Density and shape

- Application outer gutter: 8px on small screens, 12px at desktop.
- Full-width content: `w-full max-w-none`; no automatic centering cap.
- Collapsed desktop rail: 56px; expanded rail: existing 256px.
- Spacing tokens follow a 4px base: 4, 8, 12, 16, 24, 32, 48, 64.
- Radius scale remains restrained: 4, 6, 8, 12px; no pill cards.
- Cards use a 1px semantic border and little or no shadow. Elevation is reserved for overlays.

## Architecture

### 1. Token layer

Update the authoritative unlayered theme block in `src/index.css`.

- Add explicit primitive `--slate-*` and `--blue-*` custom properties used by the board.
- Remap existing semantic properties (`--background`, `--surface`, `--card`, `--primary`, `--ring`, sidebar roles, etc.) to the approved palette in light and dark themes.
- Keep existing semantic property names so production components inherit the new world without component-by-component color edits.
- Preserve distinct semantic statuses and the existing Tailwind `@theme` mappings.
- Update comments that currently describe warm paper/amber so documentation matches behavior.

### 2. App shell

Update `src/components/layout/AppLayout.tsx`:

- Change collapsed desktop margin from 86px to 56px.
- Keep `lg:ml-64` for expanded mode.
- Replace normal-page `p-4 lg:p-6` with minimal adaptive gutters (`p-2 lg:p-3`).
- Replace `mx-auto w-full max-w-screen-2xl` with `w-full max-w-none`.
- Keep fleet-map `h-full`, zero-padding, and overflow behavior unchanged.

Update `src/components/layout/Topbar.tsx` and the demo banner wrapper to align horizontal padding with the 8/12px shell grid.

### 3. Collapsed navigation

Update `src/components/layout/Sidebar.tsx`:

- Collapsed width becomes 56px.
- `renderRailContent` renders only the icon container; no visible label span.
- Direct links and grouped section buttons retain `aria-label` and `title`.
- Group flyouts retain their visible heading and item labels after interaction.
- The active marker, focus ring, hover state, pointer-open delay, click pinning, and keyboard behavior remain intact.
- Expanded desktop and mobile drawer continue to render visible labels.

Update existing tests that currently assert visible collapsed labels. New expectations verify that accessible names remain while visible label text is absent from the rail. Update shell-offset expectations from 86px to 56px.

### 4. Shared design-system board

Create a single product component under `src/features/design-system/`, exported for both route and Storybook.

The component is presentational and uses only existing production primitives and CSS semantic tokens. It owns no API call and requires no provider beyond those already available to the app and Storybook.

Board structure:

- **DS-00 Overview:** principles, token hierarchy, usage rules, accessibility baseline, naming convention.
- **DS-01 Color:** Slate and Blue primitive scales from 100–900; semantic role matrix for canvas, surface, elevated surface, text, border, primary, focus, success, warning, destructive, and information.
- **DS-02 Typography:** complete caption-to-H1 scale, Manrope/JetBrains Mono roles, tabular number samples, concise Uzbek writing rules.
- **DS-03 Foundations:** spacing bars/tokens, radius samples, border treatments, and elevation levels.
- **DS-04 Component Usage:** the Surface policy (S1-S10) and Page archetypes (A1-A6) from this spec as the centerpiece, shown with small visual diagrams; plus anatomy, do/don't rules, state order, icon and label guidance, density and accessibility rules.
- **DS-05 Components:** real `Card` (and, once wave 1 lands, `StatCard` and `DataCard`), Button, Input, Select, Switch, Checkbox, RadioGroup, Badge, and navigation examples. Show default, hover-equivalent visual sample, focused, selected, disabled, error, and destructive states where relevant. Static state samples may apply state-specific utility classes but must use the real primitive component.

Presentation:

- Full-width dark board canvas with a compact sticky table of contents on wide screens and a horizontal jump list on smaller screens.
- Strong section numbers, large headings, 1px dividers, dense responsive grids, and copyable-looking mono token labels.
- No gradients, glass effects, emoji icons, decorative glow, or invented product claims.
- All examples have labels; icon-only examples have accessible names; focus treatment is visible.

### 5. Storybook integration

- Add a fullscreen story under `src/stories/` that renders the shared board.
- Replace hardcoded Storybook background values with application semantic colors where supported, and make dark the default toolbar theme.
- Keep existing component stories working.
- The existing Tokens story may be reduced to a pointer to the board or retained only if it does not duplicate token documentation; one source of displayed token truth is preferred.

### 6. Product route and navigation

- Add file-based route `src/routes/_authenticated.design-system.tsx` rendering the shared board.
- Add `/design-system` to `AppRoutePath`, `ROUTE_CAPABILITIES`, and System navigation with `manageUsers`.
- Add Uzbek and other currently supported locale strings for the navigation label and page metadata using the existing i18n structure.
- Do not edit `src/routeTree.gen.ts` manually; let the existing route generator update it.
- Unauthorized users must be denied by the same route guard path used by other capability routes, not merely hidden from navigation.

## Test strategy

### Regression tests first

1. Update/add sidebar tests so the collapsed rail fails while visible labels remain, then passes when labels are visually removed but accessible links/buttons remain discoverable by role/name.
2. Update AppLayout tests for 56px offset, minimal padding, no max-width cap, and unchanged fleet-map exception.
3. Add route-access/navigation tests proving `/design-system` requires `manageUsers` and is hidden without it.
4. Add a board render test that asserts all six section headings and the required component families.

### Verification commands

- Focused Vitest files for sidebar, AppLayout, navigation/route access, and design-system board.
- `pnpm run lint`
- `pnpm run typecheck`
- `pnpm run build`
- `pnpm run build-storybook`

### Browser verification

Run the development app and Storybook. Inspect one bounded pass at:

- Desktop: 1440×900, expanded and collapsed sidebar.
- Wide desktop: supplied 2000px-class layout or nearest reproducible width, confirming no centered box/max-width dead zone.
- Mobile: 390×844, confirming the mobile drawer still uses labels and no horizontal scrolling appears.
- Product `/design-system`: owner/dev access and visual completeness.
- Storybook board: same sections and tokens as the product route.

Capture desktop and mobile evidence, fix defects in one batch, and confirm with at most one additional screenshot round.

## Delivery workflow

1. One implementer owns all code changes so token, shell, routing, and documentation stay coherent.
2. The implementer uses TDD for changed behavior and does not review their own work.
3. After implementation and verification, at least two fresh adversarial reviewers inspect independently. Their only job is to find bugs and concrete reasons the code or UI does not work; they do not edit files.
4. Reviewer A focuses on runtime behavior, routing/RBAC, responsive layout, tests, and regressions.
5. Reviewer B focuses on visual-system consistency, accessibility, component states, Storybook parity, and mismatch with the approved brief.
6. One implementer receives both reports, fixes validated findings in one batch, reruns verification, and never asks reviewers to implement.

## Completion evidence

The task is complete only when every success criterion maps to source evidence, passing commands, and valid browser screenshots. Green tests alone are insufficient if the board, full-width shell, or collapsed rail behavior has not been inspected in the running UI.
