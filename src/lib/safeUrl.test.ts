import { describe, expect, it } from 'vitest';
import { safeUrl } from './safeUrl';

describe('safeUrl', () => {
  it('keeps http(s) links', () => {
    expect(safeUrl('https://www.youtube.com/watch?v=abc')).toBe(
      'https://www.youtube.com/watch?v=abc',
    );
    expect(safeUrl('http://example.com/a')).toBe('http://example.com/a');
  });

  it.each([
    'javascript:alert(1)',
    ' JaVaScRiPt:alert(document.cookie)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
  ])('blocks dangerous scheme %s', (value) => {
    expect(safeUrl(value)).toBeUndefined();
  });

  it('returns undefined for empty input', () => {
    expect(safeUrl(undefined)).toBeUndefined();
    expect(safeUrl('   ')).toBeUndefined();
  });
});
