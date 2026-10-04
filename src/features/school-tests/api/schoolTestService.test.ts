import { beforeEach, describe, expect, it, vi } from 'vitest';
import axiosInstance from '@/api/axiosInstance';
import {
  fetchTestTemplatesPage,
  testTemplatesPageQueryOptions,
} from '@/features/school-tests/api/schoolTestService';

vi.mock('@/api/axiosInstance', () => ({ default: { get: vi.fn() } }));
const response = {
  data: {
    data: [],
    meta: {
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  },
};

beforeEach(() =>
  vi.mocked(axiosInstance.get).mockReset().mockResolvedValue(response),
);

describe('school template search adapter', () => {
  it('passes normalized literal search and abort signal with pagination', async () => {
    const signal = new AbortController().signal;
    await fetchTestTemplatesPage(
      { page: 2, limit: 50, search: '  50%_\\term  ' },
      signal,
    );
    expect(axiosInstance.get).toHaveBeenCalledWith('/tests/templates', {
      params: { page: 2, limit: 50, search: '50%_\\term' },
      signal,
    });
  });
  it('omits whitespace search and preserves server zero metadata', async () => {
    const result = await fetchTestTemplatesPage({ search: '   ' });
    expect(axiosInstance.get).toHaveBeenCalledWith('/tests/templates', {
      params: { page: 1, limit: 20, search: undefined },
      signal: undefined,
    });
    expect(result.meta.total).toBe(0);
    expect(result.data).toEqual([]);
  });
  it('keys normalized search cohorts independently from page and size', () => {
    const key = (search: string, page = 1, limit = 20) =>
      testTemplatesPageQueryOptions({ search, page, limit }).queryKey;
    expect(key(' term ')).toEqual(key('term'));
    expect(key('')).toEqual(key('   '));
    expect(key('first')).not.toEqual(key('second'));
    expect(key('first', 1)).not.toEqual(key('first', 2));
    expect(key('first', 1, 20)).not.toEqual(key('first', 1, 50));
  });
});
