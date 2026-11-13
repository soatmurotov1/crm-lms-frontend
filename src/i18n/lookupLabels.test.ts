import { describe, it, expect } from 'vitest';
import uz from './locales/uz.json';
import ru from './locales/ru.json';
import en from './locales/en.json';

const keys = [
  'common.previous',
  'branches.address',
  'branches.phone',
  'branches.name_placeholder',
  'students.student',
  'common.select_branch',
];

describe('lookup labels', () => {
  it.each([
    ['uz', uz],
    ['ru', ru],
    ['en', en],
  ])('has meaningful labels in %s', (_, dictionary) => {
    for (const key of keys) {
      const value = key
        .split('.')
        .reduce<unknown>(
          (current, part) =>
            current && typeof current === 'object'
              ? (current as Record<string, unknown>)[part]
              : undefined,
          dictionary,
        );
      expect(value, key).toBeTypeOf('string');
      expect(value, key).not.toBe('');
      expect(value, key).not.toBe(key);
    }
  });
});
