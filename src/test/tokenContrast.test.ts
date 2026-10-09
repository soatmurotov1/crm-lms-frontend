import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/index.css', 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
);
function declarations(selector: string) {
  const tokens: Record<string, string> = {};
  for (const block of css.matchAll(
    new RegExp(`${selector}\\s*\\{([^}]+)\\}`, 'g'),
  )) {
    for (const match of block[1].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
      tokens[match[1]] = match[2].trim();
    }
  }
  return tokens;
}
function resolve(
  tokens: Record<string, string>,
  name: string,
  seen: string[] = [],
): string {
  if (seen.includes(name)) throw new Error(`Circular token: ${name}`);
  const value = tokens[name];
  if (!value) throw new Error(`Missing token: ${name}`);
  return value.replace(/var\(--([\w-]+)\)/g, (_, reference: string) =>
    resolve(tokens, reference, [...seen, name]),
  );
}
function rgb(hsl: string) {
  const [hue, saturation, lightness] = hsl.split(/\s+/).map(parseFloat);
  const s = saturation / 100;
  const l = lightness / 100;
  const a = s * Math.min(l, 1 - l);
  return [0, 8, 4].map((n) => {
    const k = (n + hue / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return c;
  });
}
function rgbLuminance(rgb: number[]) {
  const linear = rgb.map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}
function luminance(hsl: string) {
  return rgbLuminance(rgb(hsl));
}
const pairs = [
  ['foreground', 'background'],
  ['foreground', 'accent'],
  ['foreground', 'muted'],
  ['card-foreground', 'card'],
  ['card-foreground', 'accent'],
  ['popover-foreground', 'popover'],
  ['muted-foreground', 'background'],
  ['muted-foreground', 'card'],
  ['muted-foreground', 'popover'],
  ['muted-foreground', 'surface'],
  ['muted-foreground', 'muted'],
  ['muted-foreground', 'secondary'],
  ['muted-foreground', 'accent'],
  ['primary-foreground', 'primary'],
  ['secondary-foreground', 'secondary'],
  ['accent-foreground', 'accent'],
  ['destructive-foreground', 'destructive'],
  ['success-foreground', 'success'],
  ['warning-foreground', 'warning'],
  ['info-foreground', 'info'],
  ['sidebar-foreground', 'sidebar-background'],
  ['sidebar-foreground', 'sidebar-accent'],
];
const light = declarations(':root(?:,\\s*\\.light)?');
for (const [theme, tokens] of [
  ['light', light],
  ['dark', { ...light, ...declarations('\\.dark') }],
] as const) {
  describe(`${theme} text contrast`, () => {
    it.each([
      ['ring', 'background'],
      ['ring', 'card'],
      ['destructive-foreground', 'destructive'],
    ])(
      '%s focus ring on %s meets WCAG non-text contrast',
      (foreground, background) => {
        const a = luminance(resolve(tokens, foreground));
        const b = luminance(resolve(tokens, background));
        expect(
          (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
        ).toBeGreaterThanOrEqual(3);
      },
    );
    it('success text on the referral badge hover tint meets WCAG AA', () => {
      const ink = rgb(resolve(tokens, 'success'));
      for (const surface of ['background', 'card']) {
        const base = rgb(resolve(tokens, surface));
        const a = rgbLuminance(ink);
        const b = rgbLuminance(base.map((c, i) => c * 0.85 + ink[i] * 0.15));
        expect(
          (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
        ).toBeGreaterThanOrEqual(4.5);
      }
    });
    for (const role of ['success', 'warning', 'destructive', 'info']) {
      for (const surface of ['background', 'card', 'popover', 'muted']) {
        for (const opacity of [0, 0.1]) {
          it(`${role} on ${surface} with ${opacity * 100}% status tint meets WCAG AA`, () => {
            const ink = rgb(resolve(tokens, role));
            const base = rgb(resolve(tokens, surface));
            const background = base.map(
              (c, i) => c * (1 - opacity) + ink[i] * opacity,
            );
            const a = rgbLuminance(ink);
            const b = rgbLuminance(background);
            expect(
              (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
            ).toBeGreaterThanOrEqual(4.5);
          });
        }
      }
    }
    it('success text on an opaque badge inside a success tint meets WCAG AA', () => {
      const status = rgb(resolve(tokens, 'success'));
      const base = rgb(resolve(tokens, 'background'));
      const parent = base.map((c, i) => c * 0.9 + status[i] * 0.1);
      // The opaque bg-background badge prevents two status tints from stacking.
      const badge = parent.map((c, i) => c * 0 + base[i]);
      const a = rgbLuminance(status);
      const b = rgbLuminance(badge);
      expect(
        (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
      ).toBeGreaterThanOrEqual(4.5);
    });
    for (const surface of ['background', 'card', 'popover']) {
      it(`success foreground on 90% success hover fill over ${surface} meets WCAG AA`, () => {
        const fill = rgb(resolve(tokens, 'success'));
        const base = rgb(resolve(tokens, surface));
        const a = luminance(resolve(tokens, 'success-foreground'));
        const b = rgbLuminance(base.map((c, i) => c * 0.1 + fill[i] * 0.9));
        expect(
          (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
        ).toBeGreaterThanOrEqual(4.5);
      });
    }
    it.each(pairs)('%s on %s meets WCAG AA', (foreground, background) => {
      const a = luminance(resolve(tokens, foreground));
      const b = luminance(resolve(tokens, background));
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      expect(
        ratio,
        `${theme}: --${foreground}/--${background} = ${ratio.toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(4.5);
    });
  });
}

it('resolves semantic color aliases in the local theme', () => {
  expect(css).toMatch(
    /@theme\s+inline\s*\{[^}]*--color-background:\s*hsl\(var\(--background\)\)/,
  );
});

describe('applied contrast fixes stay in the components', () => {
  it('destructive toast close button keeps its destructive-foreground focus ring', () => {
    const toast = readFileSync('src/components/ui/toast.tsx', 'utf8');
    expect(toast).toContain(
      'group-[.destructive]:focus-visible:ring-destructive-foreground',
    );
    expect(toast).toContain(
      'group-[.destructive]:focus-visible:ring-offset-destructive',
    );
  });
  it('referral badge keeps a hover tint within the tested 15% contrast budget', () => {
    const student = readFileSync(
      'src/features/students/pages/StudentDetailPage.tsx',
      'utf8',
    );
    expect(student).toContain('hover:bg-success/15');
    expect(student).not.toMatch(/hover:bg-success\/(?:2\d|[3-9]\d)/);
  });
});
