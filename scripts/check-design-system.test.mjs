import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectViolations,
  checkRatchet,
  compareBaselines,
} from './check-design-system.mjs';

describe('design system guard', () => {
  it('detects multiline cn and conditional class debt together with nested surfaces', () => {
    const source = `<Card><div className={cn(\n 'bg-card',\n active && 'border border-primary/50 rounded-xl shadow-sm',\n 'glass-card'\n)}><DataCard title="Row" /></div></Card>`;
    const rules = detectViolations(source, 'src/example.tsx').map(
      (v) => v.rule,
    );
    for (const rule of [
      'raw-surface',
      'glass',
      'shadow',
      'tinted-border',
      'nested-card',
    ])
      assert.ok(rules.includes(rule), rule);
  });

  it('resolves class constants without reading comments or copy as classes', () => {
    const rules = detectViolations(
      `const base = 'rounded-2xl bg-card border'; const styles = cn(base, 'shadow-lg'); // glass-card\n export const Demo = () => <section className={styles}>glass-card</section>`,
      'src/example.tsx',
    ).map((v) => v.rule);
    assert.ok(rules.includes('raw-surface'));
    assert.ok(rules.includes('radius'));
    assert.ok(!rules.includes('glass'));
  });

  it('allows controls, overlays, maps, unbordered insets and divider groups', () => {
    const source = `<Card><input className="rounded-md border border-destructive bg-card" /><DialogContent className="rounded-xl border border-border bg-card shadow-xl" /><div className="rounded-md bg-muted/40" /><section className="border-t border-border" /><MapContainer className="rounded-lg border bg-card shadow-sm" /></Card>`;
    assert.deepEqual(detectViolations(source, 'src/example.tsx'), []);
  });

  it('does not exempt entire test or feature paths', () => {
    assert.ok(
      detectViolations(
        `<div className="glass-card"/>`,
        'src/features/example.test.tsx',
      ).some((v) => v.rule === 'glass'),
    );
  });

  it('enforces per-file monotonic limits, new-file zero, and explicit migrated-file zero', () => {
    const baseline = {
      files: { 'a.tsx': { shadow: 1 }, 'b.tsx': { shadow: 2 } },
      zeroFiles: ['a.tsx'],
    };
    const violations = [
      { file: 'a.tsx', rule: 'shadow', line: 1 },
      { file: 'new.tsx', rule: 'shadow', line: 1 },
    ];
    const errors = checkRatchet(violations, baseline);
    assert.ok(errors.some((e) => e.includes('a.tsx') && e.includes('zero')));
    assert.ok(errors.some((e) => e.includes('new.tsx')));
    assert.deepEqual(
      checkRatchet([{ file: 'b.tsx', rule: 'shadow', line: 1 }], baseline),
      [],
    );
  });
});

describe('AST boundaries', () => {
  it('resolves constants in their lexical scope', () => {
    const report = detectViolations(
      `function Bad(){const classes='bg-card border rounded-lg';return <div className={classes}/>}; function Good(){const classes='p-4';return <div className={classes}/>}`,
      'src/example.tsx',
    );
    assert.equal(report.filter((v) => v.rule === 'raw-surface').length, 1);
  });
  it('keeps mutually exclusive class branches separate', () => {
    assert.deepEqual(
      detectViolations(
        `<div className={active ? 'bg-card' : 'border rounded-lg'} />`,
        'src/example.tsx',
      ),
      [],
    );
  });
  it('resets nesting across portal overlays and preserves slotted controls', () => {
    assert.deepEqual(
      detectViolations(
        `<Card><DialogContent><Card /></DialogContent><Button asChild><a className="bg-card border rounded-md" /></Button></Card>`,
        'src/example.tsx',
      ),
      [],
    );
  });
  it('detects computed static classes and arbitrary surface sizes', () => {
    const report = detectViolations(
      "const styles={panel:'bg-card border rounded-lg'};const Demo=()=> <><div className={styles['panel']}/><div className={`bg-${'card'} border rounded-lg`} /><Card className='md:p-[24px] rounded-[1rem]' /></>",
      'src/example.tsx',
    );
    assert.equal(report.filter((v) => v.rule === 'raw-surface').length, 2);
    assert.ok(report.some((v) => v.rule === 'surface-padding'));
    assert.ok(report.some((v) => v.rule === 'surface-radius'));
  });
});

describe('committed baseline protection', () => {
  it('rejects increased budgets, new debt budgets, and removed zero-file protections', () => {
    const before = {
      files: { 'a.tsx': { shadow: 2 } },
      zeroFiles: ['clean.tsx'],
    };
    assert.equal(
      compareBaselines(
        {
          files: { 'a.tsx': { shadow: 3 }, 'new.tsx': { shadow: 1 } },
          zeroFiles: [],
        },
        before,
      ).length,
      3,
    );
    assert.deepEqual(
      compareBaselines(
        {
          files: { 'a.tsx': { shadow: 1 } },
          zeroFiles: ['clean.tsx', 'a.tsx'],
        },
        before,
      ),
      [],
    );
  });
});

describe('exact surface geometry', () => {
  it('flags 12px radius on raw tinted or bordered surfaces but not on popover-token overlays', () => {
    const radius = (src) =>
      detectViolations(src, 'src/example.tsx').filter((v) => v.rule === 'radius');
    assert.equal(radius(`<div className="absolute inset-0 rounded-xl bg-background/60" />`).length, 1);
    assert.equal(radius(`<div className="rounded-xl border border-border p-3" />`).length, 1);
    assert.equal(radius(`<div className="rounded-xl bg-popover p-4 text-popover-foreground" />`).length, 0);
    assert.equal(radius(`<div className="rounded-xl p-2" />`).length, 0);
  });
  it('detects directional padding and smaller radius overrides on content cards', () => {
    const rules = detectViolations(
      `<Card className="pt-10 rounded-md" /><Card className="sm:ps-8 rounded-sm" />`,
      'src/example.tsx',
    );
    assert.equal(rules.filter((v) => v.rule === 'surface-padding').length, 2);
    assert.equal(rules.filter((v) => v.rule === 'surface-radius').length, 2);
    assert.deepEqual(
      detectViolations(
        `<Button className="pt-10 rounded-md" /><DialogContent className="pt-10 rounded-sm" />`,
        'src/example.tsx',
      ),
      [],
    );
  });
  it('detects important utilities in either Tailwind syntax', () => {
    for (const source of [
      `<div className="!bg-card !border !rounded-lg" />`,
      `<div className="bg-card! border! rounded-lg!" />`,
    ])
      assert.ok(
        detectViolations(source, 'src/example.tsx').some(
          (v) => v.rule === 'raw-surface',
        ),
      );
    assert.ok(
      detectViolations(
        `<Card className="md:!pt-10 rounded-md!" />`,
        'src/example.tsx',
      ).some((v) => v.rule === 'surface-padding'),
    );
  });
});

describe('numeric surface padding', () => {
  it('rejects all spacing values outside the approved 0, 12, and 16 pixel scale', () => {
    for (const token of [
      'p-2',
      'sm:px-4.5',
      'p-100',
      'p-[8px]',
      'p-[18px]',
      'p-[400px]',
    ]) {
      assert.ok(
        detectViolations(
          `<Card className="${token}" />`,
          'src/example.tsx',
        ).some((v) => v.rule === 'surface-padding'),
        token,
      );
    }
  });
  it('allows approved numeric and equivalent arbitrary spacing, controls, and overlays', () => {
    for (const token of [
      'p-0',
      'p-3',
      'p-4',
      'p-[0px]',
      'p-[12px]',
      'p-[16px]',
      'p-[0.75rem]',
      'p-[1rem]',
    ]) {
      assert.deepEqual(
        detectViolations(
          `<Card edgeToEdge className="${token}" />`,
          'src/example.tsx',
        ),
        [],
        token,
      );
    }
    assert.deepEqual(
      detectViolations(
        `<Button className="p-2"/><DialogContent className="p-100"/>`,
        'src/example.tsx',
      ),
      [],
    );
  });
});

describe('palette-color guard', () => {
  it('flags palette classes in variants, constants and status maps', () => {
    const source = `const tones = [{color: 'text-green-600 bg-green-50'}]; const classes = cva('hover:bg-rose-500'); export const Demo = () => <div>{tones.map(tone => <button className={cn(classes, tone.color)} />)}</div>`;
    assert.equal(
      detectViolations(source, 'src/example.tsx').filter(
        (v) => v.rule === 'palette-color',
      ).length,
      2,
    );
  });
  it('flags literal colors inside className expressions', () => {
    for (const color of [
      'bg-[#abcdef]',
      'text-[hsl(0_70%_40%)]',
      'border-[rgb(12,34,56)]',
      '[color:#abcdef]',
      'bg-[rgba(12,34,56,0.5)]',
    ])
      assert.ok(
        detectViolations(
          `<div className={cn('${color}')} />`,
          'src/example.tsx',
        ).some((v) => v.rule === 'palette-color'),
      );
  });
  it('detects assembled palette classes', () => {
    assert.ok(
      detectViolations(
        `const family = 'green'; const shade = '600'; export const Demo = () => <div className={'text-' + family + '-' + shade} />`,
        'src/example.tsx',
      ).some((v) => v.rule === 'palette-color'),
    );
  });
  it('ignores palette-like copy and resolves helper returns', () => {
    const source = `const copy = 'text-green-600'; function tone() {return 'text-green-600'} export const Demo = () => <div><p>{copy}</p><span className={tone()} /></div>`;
    assert.equal(
      detectViolations(source, 'src/example.tsx').filter(
        (v) => v.rule === 'palette-color',
      ).length,
      1,
    );
  });
  it('allows semantic tokens and data-driven inline colors', () => {
    assert.deepEqual(
      detectViolations(
        `<Badge className="bg-success/10 text-success border-border hover:bg-success/90 bg-[hsl(var(--success))]" style={{color: '#abcdef'}} />`,
        'src/example.tsx',
      ),
      [],
    );
  });
  it('allows data color comparisons and third-party SVG color selectors', () => {
    const source = `const colors = ['#123456']; const selected = color === colors[0]; export const Demo = () => <div className={cn(selected ? 'bg-muted' : '', "[&_line[stroke='#ccc']]:stroke-border")} style={{backgroundColor: colors[0]}} />`;
    assert.deepEqual(detectViolations(source, 'src/example.tsx'), []);
  });
  it('excludes tests, stories and the design-system board from palette checks only', () => {
    for (const file of [
      'src/example.test.tsx',
      'src/example.stories.tsx',
      'src/__tests__/example.tsx',
      'src/stories/example.tsx',
      'src/features/design-system/DesignSystemBoard.tsx',
    ])
      assert.ok(
        !detectViolations('<div className="text-green-600" />', file).some(
          (v) => v.rule === 'palette-color',
        ),
      );
  });
});


describe('batch 3d class expression boundaries', () => {
  const palette = (source) => detectViolations(source, 'src/example.tsx').filter((v) => v.rule === 'palette-color');
  it('resolves only the referenced object property in lexical scope', () => {
    assert.equal(palette("const copy={color:'text-red-500'}; const tone={color:'text-success'}; <div className={tone.color}/>").length, 0);
    assert.equal(palette("const tone={color:'text-red-500'}; function Good(){const tone={color:'text-success'}; return <div className={tone.color}/>}").length, 0);
    assert.equal(palette("const tone={color:'text-red-500',copy:'text-blue-500'}; <div className={tone.color}/>").length, 1);
  });
  it('inspects helper returns without logs, unused nested functions or arguments', () => {
    assert.equal(palette("function tone(){console.log('text-red-500'); function unused(){return 'bg-blue-500'}; return 'text-success'}; <div className={tone('text-red-500')}/>").length, 0);
    assert.equal(palette("const tone=()=> 'text-red-500'; <div className={tone()}/>").length, 1);
  });
  it('detects assembled helper returns and unresolved palette families', () => {
    for (const source of [
      "function tone(){const family='red'; return `bg-${family}-500`}; <div className={tone()}/>",
      "const tone=()=> `bg-${unknown}-500`; <div className={tone()}/>",
      "<div className={`text-${unknown}-50`}/>",
    ]) assert.equal(palette(source).length, 1, source);
    assert.equal(palette("const tone=()=> `bg-${unknown}`; <div className={tone()}/>").length, 0);
  });
  it('inspects standalone class utility calls and class maps, keeping copy clean', () => {
    for (const helper of ['cva', 'tv', 'cn', 'clsx', 'twMerge', 'classNames']) {
      assert.equal(palette(`export const styles=${helper}('bg-red-500')`).length, 1, helper);
      assert.equal(palette(`export const styles=${helper}({class:'text-red-500',className:'bg-blue-500'})`).length, 2, helper);
    }
    assert.equal(palette("export const styles=cva('bg-success',{variants:{tone:{bad:'bg-red-500'}}})").length, 1);
    assert.equal(palette("// bg-red-500\n const copy='text-red-500'; t('bg-blue-500'); console.log('bg-red-500'); cn({title:'text-red-500'}); <p>bg-red-500</p>").length, 0);
  });
  it('rejects raw xl banners even inside dialogs while allowing overlay content', () => {
    for (const classes of ['rounded-xl border border-border', 'rounded-xl bg-warning/10']) {
      assert.ok(detectViolations(`<DialogContent><div className="${classes}"/></DialogContent>`, 'src/example.tsx').some((v)=>v.rule==='radius'));
    }
    assert.deepEqual(detectViolations('<DialogContent className="rounded-xl border bg-popover"/><PopoverContent className="rounded-xl bg-popover"/><div className="rounded-lg bg-warning/10"/>', 'src/example.tsx'), []);
  });
});
