import { beforeEach, describe, expect, it, vi } from 'vitest';
import axiosInstance from '@/api/axiosInstance';
import {
  fetchQuestionsPage,
  questionsPageQueryOptions,
} from '@/features/questions/api/questionService';

vi.mock('@/api/axiosInstance', () => ({ default: { get: vi.fn() } }));

beforeEach(() => vi.clearAllMocks());

describe('question server search adapter', () => {
  it('passes trimmed search, scope, page and cancellation while retaining server totals', async () => {
    const page = {
      data: [{ id: 'late-501' }],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: { success: true, data: page },
    });
    const signal = new AbortController().signal;
    expect(
      await fetchQuestionsPage(
        {
          search: '  target  ',
          visibility: 'school_private',
          branchId: 'branch-a',
          status: 'draft',
          topic: 'signals',
          page: 1,
          limit: 10,
        },
        signal,
      ),
    ).toMatchObject(page);
    expect(axiosInstance.get).toHaveBeenCalledWith('/questions', {
      params: {
        search: 'target',
        visibility: 'school_private',
        branch_id: 'branch-a',
        status: 'draft',
        topic: 'signals',
        page: 1,
        limit: 10,
      },
      signal,
    });
  });

  it('keys distinct searches independently and normalizes blank/trimmed searches', () => {
    const key = (search?: string) =>
      questionsPageQueryOptions({ search }).queryKey;
    expect(key('a')).not.toEqual(key('b'));
    expect(key(' a ')).toEqual(key('a'));
    expect(key(' ')).toEqual(key());
  });

  it('keeps a zero searched total and restores an omitted search after clear', async () => {
    const page = {
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: { success: true, data: page },
    });
    expect(await fetchQuestionsPage({ search: 'missing' })).toMatchObject(page);
    await fetchQuestionsPage({ search: ' ' });
    expect(
      vi.mocked(axiosInstance.get).mock.lastCall?.[1]?.params.search,
    ).toBeUndefined();
  });
});
