import { useId, useState, type ReactNode } from 'react';
import { SquaresFour } from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';
import { DataCard } from '@/components/ui/DataCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

const sections = [
  'Overview',
  'Color',
  'Typography',
  'Foundations',
  'Component Usage',
  'Components',
];
const surfacePolicy = [
  'S1. Only Card, StatCard, and DataCard draw a bordered surface. No raw element combines bg-card, border, and rounded. The glass-card and glass* classes are removed.',
  'S2. No card inside a card. Group inside a card with dividers (divide-y, border-t) or an unbordered inset (bg-muted/40 rounded-md).',
  'S3. Card: 8px radius (rounded-lg), 1px border-border, no shadow, padding p-4 (p-3 when dense). Header: title 16px/600 with an optional 13px muted description on the left, actions on the right.',
  'S4. Radius scale: 6px controls (rounded-md), 8px cards (rounded-lg), 12px dialogs and sheets (rounded-xl). rounded-full only for avatars, badges, and switches. No rounded-2xl or larger.',
  'S5. Elevation: none on in-page surfaces. Overlays use one overlay shadow token.',
  'S6. Borders: border-border only. Hover and selected states use bg-muted/40 or bg-accent, never a tinted border; focus uses the ring.',
  'S7. Tables and lists: one Card per table, overflow-hidden, table edge to edge. Below md, rows render as DataCards.',
  'S8. Empty, loading, and error states render inside the Card through EmptyState and Skeleton.',
  'S9. Rhythm: 16px (space-y-4) between page-level blocks, 12px (gap-3) in card grids, 8px/12px outer gutters.',
  'S10. Status is never color-only: pair color with an icon or text.',
];
const archetypes = [
  {
    title: 'A1 List page',
    description:
      'PageHeader → filter row (ListSearchField plus filters) → Card holding the table or DataGrid → PaginationControls.',
    blocks: [
      'PageHeader',
      'Search + filters',
      'Table / DataGrid',
      'PaginationControls',
    ],
  },
  {
    title: 'A2 Detail page',
    description:
      'EntityDetailShell (back and header) → optional StatCard row → Tabs → Card sections (lg:grid-cols-2).',
    blocks: [
      'Back + entity header',
      'Optional StatCard row',
      'Tabs',
      'Card sections · 2 columns',
    ],
  },
  {
    title: 'A3 Dashboard',
    description:
      'PageHeader → filter row → three primary StatCards → attention band (two Cards) → analysis Cards → collapsible details.',
    blocks: [
      'PageHeader + filters',
      '3 primary StatCards',
      '2 attention Cards',
      'Analysis Cards',
      'Collapsible details',
    ],
  },
  {
    title: 'A4 Form or dialog',
    description:
      'Dialog (12px radius) with header, body, footer. Sections are separated by dividers. The primary action sits on the right, a destructive action on the left.',
    blocks: [
      'Dialog header',
      'Body sections + dividers',
      'Destructive ← footer → Primary',
    ],
  },
  {
    title: 'A5 Settings or profile',
    description:
      'Stacked Cards with headers. A single-column form may use a left-aligned max-w-3xl; never centered.',
    blocks: [
      'Card header + form',
      'Card header + form',
      'Left-aligned max-w-3xl',
    ],
  },
  {
    title: 'A6 Exceptions',
    description:
      'The fleet map (full bleed) and Login/NotFound (standalone layouts).',
    blocks: ['Fleet map · full bleed', 'Login / NotFound · standalone'],
  },
];
const roles = [
  ['Canvas', 'background'],
  ['App chrome', 'surface'],
  ['Card / elevated surface', 'card'],
  ['Overlay', 'popover'],
  ['Text', 'foreground'],
  ['Muted text', 'muted-foreground'],
  ['Border', 'border'],
  ['Primary action', 'primary'],
  ['Focus', 'ring'],
  ['Success', 'success'],
  ['Warning', 'warning'],
  ['Destructive', 'destructive'],
  ['Information', 'info'],
];
const states = [
  'Default',
  'Hover sample',
  'Focused',
  'Selected',
  'Disabled',
  'Error',
  'Destructive',
] as const;
type SampleState = (typeof states)[number];
function stateClass(state: SampleState) {
  if (state === 'Focused')
    return 'ring-2 ring-ring ring-offset-2 ring-offset-background';
  if (state === 'Hover sample' || state === 'Selected')
    return 'bg-accent text-accent-foreground';
  return '';
}
function Section({
  number,
  children,
}: {
  number: number;
  children: ReactNode;
}) {
  return (
    <section
      id={`ds-0${number}`}
      aria-labelledby={`ds-heading-${number}`}
      className="scroll-mt-20 space-y-6 border-t border-border py-8 lg:py-12"
    >
      <h2
        id={`ds-heading-${number}`}
        className="text-[2rem] font-semibold leading-10 tracking-tight"
      >
        DS-0{number} {sections[number]}
      </h2>
      {children}
    </section>
  );
}
function Diagram({ blocks }: { blocks: string[] }) {
  return (
    <div
      className="space-y-2 bg-muted/40 p-3 text-xs"
      aria-label="Layout diagram"
    >
      {blocks.map((block, index) => (
        <div
          key={`${index}:${block}`}
          className="flex items-center gap-3 border-t border-border py-2"
        >
          <span className="font-mono text-muted-foreground">{index + 1}</span>
          {block}
        </div>
      ))}
    </div>
  );
}
function ControlSample({
  state,
  container,
}: {
  state: SampleState;
  container: HTMLDivElement | null;
}) {
  const id = useId();
  const disabled = state === 'Disabled';
  const error = state === 'Error';
  const selected = state === 'Selected';
  const className = stateClass(state);
  return (
    <div className="space-y-4 border-t border-border pt-4">
      <h4 className="text-sm font-semibold">{state}</h4>
      <div className="space-y-2">
        <label htmlFor={`${id}-input`} className="text-[13px]">
          {state} input
        </label>
        <Input
          id={`${id}-input`}
          defaultValue={selected ? 'Selected value' : ''}
          placeholder="Enter a value"
          disabled={disabled}
          aria-invalid={error || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={className}
        />
        {error && (
          <p id={`${id}-error`} className="text-sm text-destructive">
            Error: enter a valid value.
          </p>
        )}
      </div>
      <div className="space-y-2">
        <label htmlFor={`${id}-select`} className="text-[13px]">
          {state} select
        </label>
        <Select
          defaultValue={selected ? 'selected' : undefined}
          disabled={disabled}
        >
          <SelectTrigger
            id={`${id}-select`}
            aria-invalid={error || undefined}
            className={className}
          >
            <SelectValue placeholder="Choose an option" />
          </SelectTrigger>
          <SelectContent container={container}>
            <SelectItem value="default">Default option</SelectItem>
            <SelectItem value="selected">Selected option</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-3">
        <Switch
          id={`${id}-switch`}
          defaultChecked={selected}
          disabled={disabled}
          aria-invalid={error || undefined}
          className={className}
        />
        <label htmlFor={`${id}-switch`} className="text-[13px]">
          {state} switch
        </label>
      </div>
      <div className="flex items-center gap-3">
        <Checkbox
          id={`${id}-checkbox`}
          defaultChecked={selected}
          disabled={disabled}
          aria-invalid={error || undefined}
          className={className}
        />
        <label htmlFor={`${id}-checkbox`} className="text-[13px]">
          {state} checkbox
        </label>
      </div>
      <RadioGroup
        aria-label={`${state} radio group`}
        defaultValue={selected ? 'sample' : undefined}
        disabled={disabled}
        aria-invalid={error || undefined}
      >
        <div className="flex items-center gap-3">
          <RadioGroupItem
            id={`${id}-radio`}
            value="sample"
            className={className}
          />
          <label htmlFor={`${id}-radio`} className="text-[13px]">
            {state} radio
          </label>
        </div>
      </RadioGroup>
      {state === 'Destructive' && (
        <p className="text-sm text-muted-foreground">
          Destructive actions use a red Button; choice controls keep the
          standard interaction roles.
        </p>
      )}
    </div>
  );
}

/** Shared presentational reference. Theme selection is local to this board. */
export function DesignSystemBoard() {
  const [dark, setDark] = useState(true);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  return (
    <div ref={setContainer} className={dark ? 'dark' : 'light'}>
      <div className="w-full bg-background p-2 font-sans text-foreground lg:p-3">
        <header className="space-y-4 py-8">
          <p className="font-mono text-xs text-muted-foreground">
            AUTO MAKTAB / DESIGN SYSTEM / WAVE 0
          </p>
          <h1 className="text-[44px] font-semibold leading-tight tracking-tight sm:text-5xl">
            One system. Clear decisions.
          </h1>
          <p className="text-base text-muted-foreground">
            Slate surfaces, blue interactions, distinct semantic statuses. One
            source for the app and Storybook.
          </p>
          <Button
            variant="outline"
            onClick={() => setDark(!dark)}
            aria-pressed={dark}
          >
            {dark ? 'Switch to light theme' : 'Switch to dark theme'}
          </Button>
        </header>
        <div className="grid items-start gap-6 xl:grid-cols-[200px_minmax(0,1fr)]">
          <nav
            aria-label="Design system sections"
            className="sticky top-0 z-10 flex gap-2 overflow-x-auto bg-background py-3 xl:top-3 xl:flex-col"
          >
            {sections.map((name, index) => (
              <a
                key={name}
                href={`#ds-0${index}`}
                className="shrink-0 rounded-md px-3 py-2 text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="mr-2 font-mono text-muted-foreground">
                  0{index}
                </span>
                {name}
              </a>
            ))}
          </nav>
          <div className="min-w-0">
            <Section number={0}>
              <div className="grid gap-3 md:grid-cols-2">
                <Card className="shadow-none">
                  <CardHeader>
                    <CardTitle className="text-base">Principles</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p>
                      Full-width workspaces. Restrained surfaces. Predictable
                      density. Explicit status labels.
                    </p>
                    <p>
                      Canvas → app chrome → one card level → overlays. No card
                      inside a card.
                    </p>
                  </CardContent>
                </Card>
                <Card className="shadow-none">
                  <CardHeader>
                    <CardTitle className="text-base">Token contract</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p>
                      Primitive → semantic role → production component. Runtime
                      source: <code className="font-mono">src/index.css</code>.
                    </p>
                    <p>
                      Name primitives by family and step (
                      <code>--slate-900</code>); name semantics by purpose (
                      <code>--primary</code>). Use semantic roles in product UI.
                    </p>
                    <p>
                      WCAG AA: all text pairs ≥ 4.5:1 in both themes. Label
                      every input, name icon-only controls, show focus, and pair
                      status color with text or an icon.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </Section>
            <Section number={1}>
              {['slate', 'blue'].map((family) => (
                <div key={family} className="space-y-3">
                  <h3 className="text-xl font-semibold capitalize">
                    {family} primitives
                  </h3>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
                    {[100, 200, 300, 400, 500, 600, 700, 800, 900].map(
                      (step) => (
                        <div key={step} className="space-y-2">
                          <div
                            className="h-16 rounded-md"
                            style={{
                              backgroundColor: `hsl(var(--${family}-${step}))`,
                            }}
                          />
                          <code className="block break-all font-mono text-xs">
                            --{family}-{step}
                          </code>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ))}
              <h3 className="text-xl font-semibold">Semantic roles matrix</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {roles.map(([name, token]) => (
                  <div
                    key={token}
                    className="flex items-center gap-3 border-t border-border py-3"
                  >
                    <span
                      aria-hidden="true"
                      className="h-8 w-8 shrink-0 rounded-md"
                      style={{ backgroundColor: `hsl(var(--${token}))` }}
                    />
                    <div>
                      <p className="text-sm">{name}</p>
                      <code className="font-mono text-xs text-muted-foreground">
                        --{token}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
            <Section number={2}>
              <p className="text-sm text-muted-foreground">
                Manrope: interface, headings, labels and body. JetBrains Mono:
                tokens, values, dates and codes.
              </p>
              {[
                [12, 'Caption', 'text-xs'],
                [13, 'Label', 'text-[0.8125rem]'],
                [14, 'Body small', 'text-sm'],
                [16, 'Body / card title', 'text-base'],
                [20, 'Title small', 'text-xl'],
                [24, 'Title', 'text-2xl'],
                [32, 'Section heading', 'text-[2rem] leading-10'],
                [48, 'H1 / board title', 'text-5xl'],
              ].map(([size, name, className]) => (
                <div
                  key={name}
                  className="flex flex-wrap items-baseline gap-4 border-t border-border py-3"
                >
                  <code className="w-32 font-mono text-xs text-muted-foreground">
                    {name} / {size}px
                  </code>
                  <span className={String(className)}>Clear information</span>
                </div>
              ))}
              <p className="font-mono text-base tabular-nums">
                0123456789 · 1 234 567,89 · 2026-10-07 · UZS
              </p>
              <h3 className="text-xl font-semibold">Uzbek writing rules</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm">
                <li>
                  Use natural Uzbek, short sentences and concrete verbs. Lead
                  with the user’s decision.
                </li>
                <li>
                  Keep o‘ and g‘ consistent. Use the same term for the same
                  action across screens.
                </li>
                <li>
                  State the problem and the next action in errors. Avoid blame,
                  jargon and invented claims.
                </li>
                <li>
                  Use sentence case, clear units and consistent date and amount
                  formatting.
                </li>
              </ul>
            </Section>
            <Section number={3}>
              <h3 className="text-xl font-semibold">Spacing · 4px base</h3>
              <div className="space-y-3">
                {[
                  [4, 'w-1'],
                  [8, 'w-2'],
                  [12, 'w-3'],
                  [16, 'w-4'],
                  [24, 'w-6'],
                  [32, 'w-8'],
                  [48, 'w-12'],
                  [64, 'w-16'],
                ].map(([space, width]) => (
                  <div key={space} className="flex items-center gap-4">
                    <code className="w-16 font-mono text-xs">{space}px</code>
                    <div className={`h-4 bg-primary ${width}`} />
                  </div>
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  [6, 'Controls', 'rounded-md'],
                  [8, 'Cards', 'rounded-lg'],
                  [12, 'Dialogs / sheets', 'rounded-xl'],
                ].map(([radius, label, rounded]) => (
                  <div key={radius} className="space-y-3">
                    <div className={`h-16 bg-muted ${rounded}`} />
                    <p className="text-sm">
                      {label} · {radius}px
                    </p>
                  </div>
                ))}
              </div>
              <h3 className="text-xl font-semibold">Borders and elevation</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <Card className="p-4 shadow-none">
                  Level 0 · in-page, 1px border-border, no shadow.
                </Card>
                <div
                  className="rounded-xl bg-popover p-4 text-popover-foreground"
                  style={{ boxShadow: 'var(--shadow-overlay)' }}
                >
                  Level 1 · overlay, one shadow token.
                </div>
                <div className="border-t border-border p-4">
                  Divider · separate groups without another card.
                </div>
              </div>
            </Section>
            <Section number={4}>
              <h3 className="text-2xl font-semibold">
                Surface policy · S1–S10
              </h3>
              <ol className="space-y-3">
                {surfacePolicy.map((rule) => (
                  <li
                    key={rule}
                    className="border-t border-border pt-3 text-sm leading-relaxed"
                  >
                    {rule}
                  </li>
                ))}
              </ol>
              <div className="grid gap-3 md:grid-cols-2">
                <Card className="shadow-none">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Do: one surface, divided groups
                    </CardTitle>
                    <CardDescription className="text-[13px]">
                      Header left, actions right, content below.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Diagram
                      blocks={['Group one', 'Divider', 'Unbordered inset']}
                    />
                  </CardContent>
                  <CardFooter className="justify-end">
                    <Button size="sm">Sample action</Button>
                  </CardFooter>
                </Card>
                <div className="space-y-3 p-4">
                  <h4 className="text-base font-semibold">
                    Avoid: nested card (S2)
                  </h4>
                  <p className="text-sm">
                    Nested cards, tinted borders, pill cards, glass effects, and
                    shadows on page content.
                  </p>
                  <Card className="p-4" data-design-example="negative">
                    <p className="mb-3 text-sm">Outer card</p>
                    <Card className="p-4 text-sm">Nested card</Card>
                  </Card>
                </div>
              </div>
              <h3 className="text-2xl font-semibold">
                Page archetypes · A1–A6
              </h3>
              <p className="text-sm">
                Every authenticated list and detail page follows A1 or A2. Use
                the same Card, StatCard, and DataCard primitives shown below.
              </p>
              <div className="grid gap-6 md:grid-cols-2">
                {archetypes.map((archetype) => (
                  <div key={archetype.title} className="space-y-3">
                    <h4 className="text-xl font-semibold">{archetype.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {archetype.description}
                    </p>
                    <Diagram blocks={archetype.blocks} />
                  </div>
                ))}
              </div>
              <p className="text-sm">
                State order: default → hover sample → focused → selected →
                disabled → error → destructive. Icons support labels; icon-only
                controls need accessible names. Use p-4 normally, p-3 for dense
                content, and keep keyboard focus visible.
              </p>
            </Section>
            <Section number={5}>
              <h3 className="text-xl font-semibold">Button</h3>
              <div className="flex flex-wrap gap-3">
                {states.map((state) => (
                  <Button
                    key={state}
                    variant={
                      state === 'Destructive'
                        ? 'destructive'
                        : state === 'Error'
                          ? 'outline'
                          : 'default'
                    }
                    disabled={state === 'Disabled'}
                    aria-pressed={state === 'Selected' ? true : undefined}
                    className={stateClass(state)}
                  >
                    {state === 'Destructive'
                      ? 'Delete sample'
                      : `${state} action`}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Dashboard icon sample"
                >
                  <SquaresFour aria-hidden="true" />
                </Button>
              </div>
              <h3 className="text-xl font-semibold">
                Input · Select · Switch · Checkbox · RadioGroup
              </h3>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {states.map((state) => (
                  <ControlSample
                    key={state}
                    state={state}
                    container={container}
                  />
                ))}
              </div>
              <h3 className="text-xl font-semibold">
                Badge · status always includes text
              </h3>
              <div className="flex flex-wrap gap-3">
                <Badge>Selected</Badge>
                <Badge variant="secondary">Default</Badge>
                <Badge className="bg-accent text-accent-foreground">
                  Hover sample
                </Badge>
                <Badge className="ring-2 ring-ring">Focused sample</Badge>
                <Badge aria-disabled="true" className="opacity-50">
                  Disabled sample
                </Badge>
                <Badge variant="destructive">Error</Badge>
                <Badge variant="destructive">Destructive</Badge>
                {['success', 'warning', 'info'].map((status) => (
                  <Badge
                    key={status}
                    style={{
                      backgroundColor: `hsl(var(--${status}))`,
                      color: `hsl(var(--${status}-foreground))`,
                    }}
                  >
                    {status}
                  </Badge>
                ))}
              </div>
              <h3 className="text-xl font-semibold">Card anatomy and states</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {states.map((state) => (
                  <Card
                    key={state}
                    aria-disabled={state === 'Disabled' || undefined}
                    className={`shadow-none ${stateClass(state)} ${state === 'Disabled' ? 'opacity-50' : ''}`}
                  >
                    <CardHeader>
                      <CardTitle className="text-base">{state} Card</CardTitle>
                      <CardDescription className="text-[13px]">
                        Header · description · actions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm">
                      {state === 'Error'
                        ? 'Error: data could not be loaded.'
                        : state === 'Destructive'
                          ? 'Destructive action requires explicit confirmation.'
                          : 'One bordered surface. Group content with dividers.'}
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant={
                          state === 'Destructive' ? 'destructive' : 'outline'
                        }
                        disabled={state === 'Disabled'}
                        size="sm"
                      >
                        {state === 'Error'
                          ? 'Retry sample'
                          : `${state} card action`}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              <h3 className="text-xl font-semibold">
                KPI and mobile record surfaces
              </h3>
              <div className="grid gap-3 md:grid-cols-3">
                <StatCard
                  label="Collected this month"
                  value="12 400 000"
                  unit="UZS"
                  meta="Current period"
                  delta="+8%"
                />
                <StatCard label="Active students" value="124" isLoading />
                <DataCard
                  title="Group A-12"
                  subtitle="Theory · Mon, Wed, Fri"
                  fields={[
                    { label: 'Students', value: '22' },
                    { label: 'Status', value: <Badge>Active</Badge> },
                  ]}
                  actions={
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  }
                />
              </div>
              <h3 className="text-xl font-semibold">Navigation</h3>
              <nav
                aria-label="Navigation examples"
                className="flex flex-wrap gap-3"
              >
                {states.map((state) => (
                  <Button
                    key={state}
                    variant={state === 'Destructive' ? 'destructive' : 'ghost'}
                    disabled={state === 'Disabled'}
                    aria-current={state === 'Selected' ? 'page' : undefined}
                    className={stateClass(state)}
                  >
                    <SquaresFour aria-hidden="true" />
                    {state} navigation
                  </Button>
                ))}
              </nav>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
