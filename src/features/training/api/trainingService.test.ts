import { beforeEach, describe, expect, it, vi } from 'vitest';
import axiosInstance from '@/api/axiosInstance';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import {
  fetchTrainingEnrollment,
  fetchTrainingEnrollmentsPage,
  fetchTrainingProgram,
  fetchTrainingProgramsPage,
  fetchActiveTrainingPrograms,
  createTrainingEnrollment,
  trainingProgramsPageQueryOptions,
  trainingEnrollmentsPageQueryOptions,
} from '@/features/training/api/trainingService';

vi.mock('@/api/axiosInstance', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

beforeEach(() => vi.clearAllMocks());

describe('training API', () => {
  it('keeps a delayed old search response from replacing the current search', async () => {
    let finishOld!: (value: unknown) => void;
    const oldResponse = new Promise((resolve) => {
      finishOld = resolve;
    });
    const response = (id: string) => ({
      data: {
        data: [{ id }],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      },
    });
    vi.mocked(axiosInstance.get).mockImplementation((_url, config) =>
      config?.params.search === 'old'
        ? (oldResponse as never)
        : Promise.resolve(response('new-result')),
    );
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const observer = new QueryObserver(
      client,
      trainingProgramsPageQueryOptions({ search: 'old' }),
    );
    const unsubscribe = observer.subscribe(() => {});
    observer.setOptions(trainingProgramsPageQueryOptions({ search: 'new' }));
    await observer.refetch();
    expect(observer.getCurrentResult().data?.data).toEqual([
      { id: 'new-result' },
    ]);
    finishOld(response('old-result'));
    await oldResponse;
    expect(observer.getCurrentResult().data?.data).toEqual([
      { id: 'new-result' },
    ]);
    expect(
      vi.mocked(axiosInstance.get).mock.calls[0]?.[1]?.signal?.aborted,
    ).toBe(true);
    unsubscribe();
    client.clear();
  });

  it('sends literal search and abort signal with distinct search cache keys', async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } },
    });
    const signal = new AbortController().signal;
    await fetchTrainingProgramsPage({ search: '  AVTO_%\\  ' }, signal);
    expect(axiosInstance.get).toHaveBeenCalledWith(
      '/training-programs',
      expect.objectContaining({
        params: expect.objectContaining({ search: '  AVTO_%\\  ' }),
        signal,
      }),
    );
    expect(
      trainingProgramsPageQueryOptions({ search: 'first' }).queryKey,
    ).not.toEqual(
      trainingProgramsPageQueryOptions({ search: 'second' }).queryKey,
    );
  });

  it('loads approved programs with server-side filters', async () => {
    const program = { id: 'p1', name: 'B amaliyoti' };
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: {
        success: true,
        data: {
          data: [program],
          meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
        },
      },
    });
    const result = await fetchTrainingProgramsPage({
      branchId: 'b1',
      category: 'B',
      active: true,
    });
    expect(result.data).toEqual([program]);
    expect(axiosInstance.get).toHaveBeenCalledWith(
      '/training-programs',
      expect.objectContaining({
        params: {
          branch_id: 'b1',
          category: 'B',
          is_active: true,
          search: undefined,
          page: 1,
          limit: 20,
        },
      }),
    );
  });

  it('loads a program detail', async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: { success: true, data: { id: 'p1' } },
    });
    await expect(fetchTrainingProgram('p1')).resolves.toEqual({ id: 'p1' });
    expect(axiosInstance.get).toHaveBeenCalledWith(
      '/training-programs/p1',
      expect.any(Object),
    );
  });

  it('lists and loads company student enrollments', async () => {
    vi.mocked(axiosInstance.get)
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            data: [{ id: 'e1' }],
            meta: { total: 1, page: 2, limit: 10, totalPages: 2 },
          },
        },
      })
      .mockResolvedValueOnce({ data: { success: true, data: { id: 'e1' } } });
    expect(
      (
        await fetchTrainingEnrollmentsPage({
          branchId: 'b1',
          studentId: 's1',
          page: 2,
          limit: 10,
        })
      ).data,
    ).toEqual([{ id: 'e1' }]);
    expect(axiosInstance.get).toHaveBeenCalledWith(
      '/training-enrollments',
      expect.objectContaining({
        params: {
          branch_id: 'b1',
          student_id: 's1',
          status: undefined,
          search: undefined,
          search_legacy: undefined,
          page: 2,
          limit: 10,
        },
      }),
    );
    await expect(fetchTrainingEnrollment('e1')).resolves.toEqual({ id: 'e1' });
  });

  it('sends enrollment search, scope, pagination and abort signal with separate cache keys', async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: { data: [], meta: { total: 0, page: 2, limit: 50, totalPages: 0 } },
    });
    const signal = new AbortController().signal;
    const filters = {
      search: '  100%_\\  ',
      searchLegacy: true,
      branchId: 'b1',
      studentId: 's1',
      status: 'completed' as const,
      page: 2,
      limit: 50,
    };
    await fetchTrainingEnrollmentsPage(filters, signal);
    expect(axiosInstance.get).toHaveBeenCalledWith('/training-enrollments', {
      params: {
        search: filters.search,
        search_legacy: true,
        branch_id: 'b1',
        student_id: 's1',
        status: 'completed',
        page: 2,
        limit: 50,
      },
      signal,
    });
    expect(trainingEnrollmentsPageQueryOptions(filters).queryKey).not.toEqual(
      trainingEnrollmentsPageQueryOptions({ ...filters, search: 'second' })
        .queryKey,
    );
    expect(trainingEnrollmentsPageQueryOptions(filters).queryKey).not.toEqual(
      trainingEnrollmentsPageQueryOptions({ ...filters, searchLegacy: false })
        .queryKey,
    );
  });

  it('aborts the obsolete enrollment search and ignores its delayed response', async () => {
    let finishOld!: (value: unknown) => void;
    const oldResponse = new Promise((resolve) => {
      finishOld = resolve;
    });
    const response = (id: string) => ({
      data: {
        data: [{ id }],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      },
    });
    vi.mocked(axiosInstance.get).mockImplementation((_url, config) =>
      config?.params.search === 'old'
        ? (oldResponse as never)
        : Promise.resolve(response('new-enrollment')),
    );
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const observer = new QueryObserver(
      client,
      trainingEnrollmentsPageQueryOptions({ search: 'old' }),
    );
    const unsubscribe = observer.subscribe(() => {});
    observer.setOptions(trainingEnrollmentsPageQueryOptions({ search: 'new' }));
    await observer.refetch();
    expect(observer.getCurrentResult().data?.data).toEqual([
      { id: 'new-enrollment' },
    ]);
    finishOld(response('old-enrollment'));
    await oldResponse;
    expect(observer.getCurrentResult().data?.data).toEqual([
      { id: 'new-enrollment' },
    ]);
    expect(
      vi.mocked(axiosInstance.get).mock.calls[0]?.[1]?.signal?.aborted,
    ).toBe(true);
    unsubscribe();
    client.clear();
  });

  it('creates an enrollment without a branch override for managers', async () => {
    vi.mocked(axiosInstance.post).mockResolvedValue({
      data: { success: true, data: { id: 'e1' } },
    });
    await createTrainingEnrollment({ student_id: 's1', program_id: 'p1' });
    expect(axiosInstance.post).toHaveBeenCalledWith('/training-enrollments', {
      student_id: 's1',
      program_id: 'p1',
    });
  });

  it('loads every active program in a branch for enrollment selection', async () => {
    vi.mocked(axiosInstance.get)
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            data: [{ id: 'p1' }],
            meta: { page: 1, limit: 100, total: 101, totalPages: 2 },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            data: [{ id: 'p2' }],
            meta: { page: 2, limit: 100, total: 101, totalPages: 2 },
          },
        },
      });
    await expect(fetchActiveTrainingPrograms('b1')).resolves.toEqual([
      { id: 'p1' },
      { id: 'p2' },
    ]);
    expect(axiosInstance.get).toHaveBeenNthCalledWith(
      1,
      '/training-programs',
      expect.objectContaining({
        params: {
          branch_id: 'b1',
          category: undefined,
          is_active: true,
          search: undefined,
          page: 1,
          limit: 100,
        },
      }),
    );
    expect(axiosInstance.get).toHaveBeenNthCalledWith(
      2,
      '/training-programs',
      expect.objectContaining({
        params: {
          branch_id: 'b1',
          category: undefined,
          is_active: true,
          search: undefined,
          page: 2,
          limit: 100,
        },
      }),
    );
  });
});
