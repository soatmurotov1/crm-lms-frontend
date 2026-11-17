import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import axios from '@/api/axiosInstance';
import { useAuthStore } from '@/store/authStore';
import { useWriteOptions } from './useWriteOptions';

vi.mock('@/api/axiosInstance', () => ({ default: { get: vi.fn() } }));

describe('minimal write options', () => {
  beforeEach(() => vi.clearAllMocks());
  it('never exposes previous lookup rows while a new query, course or access scope loads', async () => {
    useAuthStore.setState({
      user: {
        id: 'writer',
        email: 'test@example.com',
        role: 'operator',
        access_version: 1,
        permissions: [
          { permission: 'payments.create', scope: 'branch', branch_id: 'a' },
        ],
      },
      activeBranchId: 'a',
    });
    let delay = false;
    vi.mocked(axios.get).mockImplementation(async (url) => {
      if (url === '/permissions')
        return {
          data: {
            branches: [{ id: 'a', name: 'A' }],
            permissions: [],
            templates: {},
            delegations: [],
            own_resources: [],
          },
        };
      if (delay) return new Promise(() => {});
      return {
        data: {
          students: [
            {
              id: 'student-a',
              first_name: 'Synthetic',
              last_name: 'A',
              branch_id: 'a',
            },
          ],
          students_total: 501,
        },
      };
    });
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result, rerender } = renderHook(
      ({
        search,
        course,
      }: {
        search: string;
        course: 'online' | 'offline';
      }) =>
        useWriteOptions('payments', 'create', 'a', true, {
          search,
          course_type: course,
          limit: 50,
        }),
      {
        wrapper,
        initialProps: {
          search: '',
          course: 'online' as 'online' | 'offline',
        },
      },
    );
    await waitFor(() =>
      expect(result.current.data?.students?.[0].id).toBe('student-a'),
    );
    delay = true;
    rerender({ search: 'other', course: 'online' });
    expect(result.current.data?.students).toBeUndefined();
    rerender({ search: '', course: 'online' });
    await waitFor(() =>
      expect(result.current.data?.students?.[0].id).toBe('student-a'),
    );
    rerender({ search: '', course: 'offline' });
    expect(result.current.data?.students).toBeUndefined();
    rerender({ search: '', course: 'online' });
    await waitFor(() =>
      expect(result.current.data?.students?.[0].id).toBe('student-a'),
    );
    act(() =>
      useAuthStore.setState({
        user: { ...useAuthStore.getState().user!, access_version: 2 },
      }),
    );
    expect(result.current.data?.students).toBeUndefined();
    client.clear();
  });

  it('hides cached options immediately when the current grant is revoked', async () => {
    useAuthStore.setState({
      user: {
        id: 'writer',
        email: 'test@example.com',
        role: 'operator',
        access_version: 1,
        permissions: [
          { permission: 'payments.create', scope: 'branch', branch_id: 'a' },
        ],
      },
      activeBranchId: 'a',
    });
    vi.mocked(axios.get).mockImplementation(async (url) => ({
      data:
        url === '/permissions'
          ? {
              branches: [{ id: 'a', name: 'A' }],
              permissions: [],
              templates: {},
              delegations: [],
              own_resources: [],
            }
          : {
              students: [
                {
                  id: 'student-a',
                  first_name: 'Synthetic',
                  last_name: 'A',
                  branch_id: 'a',
                },
              ],
            },
    }));
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(
      () => useWriteOptions('payments', 'create', 'a'),
      { wrapper },
    );
    await waitFor(() =>
      expect(result.current.data?.students?.[0].id).toBe('student-a'),
    );
    act(() =>
      useAuthStore.setState({
        user: { ...useAuthStore.getState().user!, permissions: [] },
      }),
    );
    expect(result.current.data).toBeUndefined();
    expect(result.current.branches).toEqual([]);
    client.clear();
  });

  it('loads only the write-purpose endpoint and offers only authorized branches', async () => {
    useAuthStore.setState({
      user: {
        id: 'writer',
        email: 'w@example.com',
        role: 'operator',
        branch_ids: ['a', 'b'],
        permissions: [
          { permission: 'students.create', scope: 'branch', branch_id: 'a' },
        ],
      },
      activeBranchId: 'a',
    });
    vi.mocked(axios.get).mockImplementation(async (url) => ({
      data:
        url === '/permissions'
          ? {
              branches: [
                { id: 'a', name: 'A' },
                { id: 'b', name: 'B' },
              ],
              permissions: [],
              templates: {},
              delegations: [],
              own_resources: [],
            }
          : {
              courses: [{ id: 'course', name: 'Course', branch_id: 'a' }],
              branches: [{ id: 'a', name: 'A' }],
            },
    }));
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(
      () => useWriteOptions('students', 'create', 'a'),
      { wrapper },
    );
    await waitFor(() =>
      expect(result.current.data?.courses?.[0].id).toBe('course'),
    );
    expect(result.current.branches).toEqual([{ id: 'a', name: 'A' }]);
    expect(axios.get).toHaveBeenCalledWith(
      '/permissions/options',
      expect.objectContaining({
        params: { resource: 'students', action: 'create', branchId: 'a' },
      }),
    );
    expect(
      vi
        .mocked(axios.get)
        .mock.calls.map(([url]) => url)
        .sort(),
    ).toEqual(['/permissions', '/permissions/options']);
  });
  it('uses the sole authorized catalogue branch for an owner without memberships', async () => {
    useAuthStore.setState({
      user: {
        id: 'owner',
        email: 'owner@example.com',
        role: 'owner',
        permissions: [],
      },
      activeBranchId: null,
    });
    vi.mocked(axios.get).mockImplementation(async (url) => ({
      data:
        url === '/permissions'
          ? {
              branches: [{ id: 'a', name: 'A' }],
              permissions: [],
              templates: {},
              delegations: [],
              own_resources: [],
            }
          : {
              students: [
                {
                  id: 'student-a',
                  first_name: 'A',
                  last_name: 'B',
                  branch_id: 'a',
                },
              ],
            },
    }));
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useWriteOptions('payments', 'create'), {
      wrapper,
    });
    await waitFor(() =>
      expect(result.current.data?.students?.[0].id).toBe('student-a'),
    );
  });
  it('requires a branch choice for multiple branches and clears old results when switching', async () => {
    useAuthStore.setState({
      user: {
        id: 'owner',
        email: 'owner@example.com',
        role: 'owner',
        permissions: [],
      },
      activeBranchId: null,
    });
    vi.mocked(axios.get).mockClear();
    vi.mocked(axios.get).mockImplementation(async (url, config) => ({
      data:
        url === '/permissions'
          ? {
              branches: [
                { id: 'a', name: 'A' },
                { id: 'b', name: 'B' },
              ],
              permissions: [],
              templates: {},
              delegations: [],
              own_resources: [],
            }
          : {
              groups: [
                {
                  id: (config?.params as { branchId?: string } | undefined)?.branchId,
                  name: 'TEST',
                  branch_id: (config?.params as { branchId?: string } | undefined)?.branchId,
                },
              ],
            },
    }));
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result, rerender } = renderHook(
      ({ branch }: { branch?: string }) =>
        useWriteOptions('lessons', 'create', branch),
      { initialProps: { branch: undefined } as { branch?: string }, wrapper },
    );
    await waitFor(() => expect(result.current.branches).toHaveLength(2));
    expect(
      vi
        .mocked(axios.get)
        .mock.calls.some(([url]) => url === '/permissions/options'),
    ).toBe(false);
    rerender({ branch: 'a' });
    await waitFor(() =>
      expect(result.current.data?.groups?.[0].id).toBe('a'),
    );
    rerender({ branch: 'b' });
    expect(result.current.data?.groups?.[0].id).not.toBe('a');
    await waitFor(() =>
      expect(result.current.data?.groups?.[0].id).toBe('b'),
    );
  });
  it('sends student lookup filters to the server and keys the cache by them', async () => {
    useAuthStore.setState({
      user: {
        id: 'owner',
        email: 'owner@example.com',
        role: 'owner',
        permissions: [],
      },
      activeBranchId: 'a',
    });
    vi.mocked(axios.get).mockClear();
    vi.mocked(axios.get).mockImplementation(async (url, config) => ({
      data:
        url === '/permissions'
          ? {
              branches: [{ id: 'a', name: 'A' }],
              permissions: [],
              templates: {},
              delegations: [],
              own_resources: [],
            }
          : {
              students: [],
              students_total: (config?.params as { search?: string } | undefined)?.search === 'ali' ? 3 : 90,
            },
    }));
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result, rerender } = renderHook(
      ({ search }) =>
        useWriteOptions('payments', 'create', undefined, true, {
          search,
          course_type: 'online',
          limit: 50,
        }),
      { wrapper, initialProps: { search: '  ' } },
    );
    await waitFor(() => expect(result.current.data?.students_total).toBe(90));
    expect(axios.get).toHaveBeenLastCalledWith(
      '/permissions/options',
      expect.objectContaining({
        params: {
          resource: 'payments',
          action: 'create',
          branchId: 'a',
          course_type: 'online',
          limit: 50,
        },
      }),
    );

    rerender({ search: ' ali ' });
    await waitFor(() => expect(result.current.data?.students_total).toBe(3));
    expect(axios.get).toHaveBeenLastCalledWith(
      '/permissions/options',
      expect.objectContaining({
        params: expect.objectContaining({ search: 'ali' }),
      }),
    );
  });
  it.each([51, 501])(
    'dispatches a bounded server search beyond %s rows and ignores a late old query',
    async (size) => {
      useAuthStore.setState({
        user: {
          id: 'owner',
          email: 'owner@example.test',
          role: 'owner',
          permissions: [],
        },
        activeBranchId: 'a',
      });
      const corpus = Array.from({ length: size }, (_, index) => ({
        id: `student-${index}`,
        first_name: index === size - 1 ? 'Needle' : 'Synthetic',
        last_name: 'Student',
        branch_id: 'a',
        phone_last4: index === size - 1 ? '9876' : '1111',
      }));
      let resolveOld:
        | ((value: {
            data: { students: typeof corpus; students_total: number };
          }) => void)
        | undefined;
      vi.mocked(axios.get).mockImplementation(async (url, config) => {
        if (url === '/permissions')
          return {
            data: {
              branches: [{ id: 'a', name: 'A' }],
              permissions: [],
              templates: {},
              delegations: [],
              own_resources: [],
            },
          };
        const params = config?.params as
          | { search?: string; limit?: number }
          | undefined;
        const search = params?.search;
        if (search === 'old')
          return new Promise((resolve) => {
            resolveOld = resolve;
          });
        const matches = search
          ? corpus.filter(
              (student) =>
                student.first_name.includes(search) ||
                student.phone_last4.includes(search),
            )
          : corpus;
        return {
          data: {
            students: matches.slice(0, params?.limit),
            students_total: matches.length,
          },
        };
      });
      const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      const wrapper = ({ children }: PropsWithChildren) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      );
      const { result, rerender, unmount } = renderHook(
        ({ search }) =>
          useWriteOptions('training_enrollments', 'create', 'a', true, {
            search,
            limit: 50,
          }),
        { wrapper, initialProps: { search: '' } },
      );
      await waitFor(() =>
        expect(result.current.data?.students_total).toBe(size),
      );
      expect(result.current.data?.students).toHaveLength(50);
      expect(
        result.current.data?.students?.some(
          (student) => student.id === `student-${size - 1}`,
        ),
      ).toBe(false);
      rerender({ search: 'old' });
      await waitFor(() => expect(resolveOld).toBeDefined());
      rerender({ search: '9876' });
      await waitFor(() =>
        expect(result.current.data?.students?.[0].id).toBe(
          `student-${size - 1}`,
        ),
      );
      expect(axios.get).toHaveBeenLastCalledWith(
        '/permissions/options',
        expect.objectContaining({
          params: expect.objectContaining({
            resource: 'training_enrollments',
            search: '9876',
            limit: 50,
            branchId: 'a',
          }),
        }),
      );
      await act(async () =>
        resolveOld!({
          data: { students: corpus.slice(0, 50), students_total: size },
        }),
      );
      expect(result.current.data?.students?.[0].id).toBe(`student-${size - 1}`);
      unmount();
      client.clear();
    },
  );
});
