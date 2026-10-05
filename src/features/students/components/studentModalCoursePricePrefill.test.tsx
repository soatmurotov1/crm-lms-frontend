import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StudentModal from '@/features/students/api/StudentModal';
import { useCreateStudent } from '@/features/students/api/studentService';
import type { CourseType } from '@/features/students/types';

// autodrive-0d6: total_price used to pre-fill from a hardcoded constant
// (courseType === 'tezkor' ? 2500000 : 6000000). It now pre-fills from the
// matching Course's real `price`, and stays editable (a discount is still
// legitimate) instead of being locked to that value.

const LEGACY_USER = { role: 'operator', branch_id: 'b1' };
const auth = vi.hoisted(() => ({
  user: null as Record<string, unknown> | null,
}));
vi.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ user: auth.user }),
}));
vi.mock('@/hooks/useCan', () => ({ useCan: () => false }));
vi.mock('@/features/branches/api/branchService', () => ({
  useBranches: () => ({ data: [] }),
}));
vi.mock('@/features/groups/api/groupService', () => ({
  useGroups: () => ({ data: [], refetch: vi.fn() }),
}));
// #342: the real create mutation runs against a mocked transport so the
// wire body (what POST /students would carry) can be asserted.
const network = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn() }));
vi.mock('@/api/axiosInstance', () => ({
  default: { post: network.post, get: network.get },
}));
vi.mock('@/lib/umami', () => ({ track: vi.fn() }));
vi.mock('@/features/students/api/studentService', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/features/students/api/studentService')
  >()),
  useStudentsPage: () => ({ data: undefined, isFetching: false }),
}));
vi.mock('@/features/students/components/StudentExamsTab', () => ({
  StudentExamsTab: () => null,
}));

const COURSE = {
  id: 'c1',
  name: 'Tezkor kurs',
  branch_id: 'b1',
  course_type: 'tezkor',
  price: 3300000,
  duration_days: 14,
  is_active: true,
  created_at: '2026-01-01',
};

// Every fixture states its course_type explicitly so a test can never pair a
// course with a form of the other type by accident (#342 review).
const SECOND_TEZKOR_COURSE = {
  ...COURSE,
  id: 'c2',
  name: 'Tezkor kurs plus',
  course_type: 'tezkor',
  price: 4100000,
};
const AVTO_COURSE = {
  ...COURSE,
  id: 'a1',
  name: 'Avto maktab B',
  course_type: 'avto_maktab',
  price: 6000000,
  duration_days: 90,
};
const SECOND_AVTO_COURSE = {
  ...AVTO_COURSE,
  id: 'a2',
  name: 'Avto maktab BC',
  price: 7500000,
};
const catalog: { courses: (typeof COURSE)[] } = { courses: [COURSE] };

vi.mock('@/features/courses/api/courseService', () => ({
  useCourses: () => ({ data: catalog.courses }),
}));

beforeEach(() => {
  catalog.courses = [COURSE];
  auth.user = LEGACY_USER;
  network.post.mockReset();
  network.get.mockReset();
  network.get.mockRejectedValue(new Error('Unexpected GET'));
});

const q = (name: string) =>
  document.querySelector(`input[name="${name}"]`) as HTMLInputElement;
const digitsOnly = (v: string) => v.replace(/\D/g, '');

describe('StudentModal total_price pre-fill from Course', () => {
  it('pre-fills total_price from the sole matching active course, not the old hardcoded constant', async () => {
    render(
      <StudentModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        courseType="tezkor"
      />,
    );

    await waitFor(() =>
      expect(digitsOnly(q('total_price').value)).toBe('3300000'),
    );
    // Old hardcoded constant for tezkor was 2500000 -- must not win.
    expect(digitsOnly(q('total_price').value)).not.toBe('2500000');
  });

  it('stays editable after pre-fill -- a manual override wins on submit', async () => {
    const onSubmit = vi.fn();
    render(
      <StudentModal
        open
        onClose={vi.fn()}
        onSubmit={onSubmit}
        courseType="tezkor"
      />,
    );

    await waitFor(() =>
      expect(digitsOnly(q('total_price').value)).toBe('3300000'),
    );

    fireEvent.change(q('last_name'), { target: { value: 'Karimov' } });
    fireEvent.change(q('learner_password'), { target: { value: 'password1' } });
    fireEvent.change(q('first_name'), { target: { value: 'Aziz' } });
    fireEvent.change(q('learner_password'), { target: { value: 'password1' } });
    fireEvent.change(q('phone'), { target: { value: '901234567' } });
    fireEvent.change(q('total_price'), { target: { value: '2000000' } });
    expect(digitsOnly(q('total_price').value)).toBe('2000000');

    fireEvent.click(screen.getByRole('button', { name: 'common.add' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].total_price).toBe(2000000);
  });
});

const CreateWithRealMutation = ({ courseType }: { courseType: CourseType }) => {
  const create = useCreateStudent();
  return (
    <StudentModal
      open
      onClose={vi.fn()}
      onSubmit={(body) => create.mutate(body)}
      loading={create.isPending}
      courseType={courseType}
    />
  );
};

const renderWithClient = (courseType: CourseType) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { mutations: { retry: false } } })
      }
    >
      <CreateWithRealMutation courseType={courseType} />
    </QueryClientProvider>,
  );

const fillSyntheticIdentity = () => {
  fireEvent.change(q('last_name'), { target: { value: 'Synthetic' } });
  fireEvent.change(q('first_name'), { target: { value: 'Student' } });
  fireEvent.change(q('phone'), { target: { value: '900000001' } });
  fireEvent.change(q('learner_password'), {
    target: { value: 'synthetic1' },
  });
};

const postedBody = () => {
  expect(network.post).toHaveBeenCalledTimes(1);
  const [url, body] = network.post.mock.calls[0];
  expect(url).toBe('/students');
  // Serialize like the HTTP client would, so undefined keys drop out.
  return JSON.parse(JSON.stringify(body)) as Record<string, unknown>;
};

describe('StudentModal quick create wire body (#342)', () => {
  it('sends the auto-selected course_id with the negotiated price and payment unchanged', async () => {
    network.post.mockResolvedValue({ data: { data: { id: 's-new' } } });
    renderWithClient('tezkor');

    await waitFor(() =>
      expect(digitsOnly(q('total_price').value)).toBe('3300000'),
    );
    fillSyntheticIdentity();
    // Negotiated price (discount) and a partial first payment.
    fireEvent.change(q('total_price'), { target: { value: '2000000' } });
    fireEvent.change(q('amount_paid'), { target: { value: '500000' } });

    fireEvent.click(screen.getByRole('button', { name: 'common.add' }));

    await waitFor(() => expect(network.post).toHaveBeenCalledTimes(1));
    const body = postedBody();
    expect(body).toMatchObject({
      course_type: 'tezkor',
      course_id: 'c1',
      total_price: 2000000,
      amount_paid: 500000,
      branch_id: 'b1',
    });
    expect(body).not.toHaveProperty('initial_payment');
  });

  it('offers only courses of the form course_type and sends the chosen one', async () => {
    // A tezkor course in the same catalog must not leak into avto_maktab.
    catalog.courses = [COURSE, AVTO_COURSE, SECOND_AVTO_COURSE];
    network.post.mockResolvedValue({ data: { data: { id: 's-new' } } });
    renderWithClient('avto_maktab');

    fillSyntheticIdentity();
    fireEvent.click(
      screen.getByRole('combobox', { name: 'students.sections.course' }),
    );
    expect(
      await screen.findByRole('option', { name: 'Avto maktab B' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'Tezkor kurs' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('option', { name: 'Avto maktab BC' }));
    await waitFor(() =>
      expect(digitsOnly(q('total_price').value)).toBe('7500000'),
    );
    fireEvent.change(q('initial_payment'), { target: { value: '1000000' } });

    fireEvent.click(screen.getByRole('button', { name: 'common.add' }));

    await waitFor(() => expect(network.post).toHaveBeenCalledTimes(1));
    expect(postedBody()).toMatchObject({
      course_type: 'avto_maktab',
      course_id: 'a2',
      total_price: 7500000,
      initial_payment: 1000000,
    });
  });

  it('does not auto-select or send a sole course of the other course_type', async () => {
    catalog.courses = [AVTO_COURSE];
    network.post.mockResolvedValue({ data: { data: { id: 's-new' } } });
    renderWithClient('tezkor');

    fillSyntheticIdentity();
    expect(
      screen.getByRole('combobox', { name: 'students.sections.course' }),
    ).not.toHaveTextContent('Avto maktab B');
    expect(digitsOnly(q('total_price').value)).toBe('');
    fireEvent.change(q('total_price'), { target: { value: '2500000' } });
    fireEvent.click(screen.getByRole('button', { name: 'common.add' }));

    await waitFor(() => expect(network.post).toHaveBeenCalledTimes(1));
    const body = postedBody();
    expect(body).toMatchObject({ course_type: 'tezkor', total_price: 2500000 });
    expect(body).not.toHaveProperty('course_id');
  });

  it('omits course_id from the wire body when no course is selected', async () => {
    catalog.courses = [COURSE, SECOND_TEZKOR_COURSE];
    network.post.mockResolvedValue({ data: { data: { id: 's-new' } } });
    renderWithClient('tezkor');

    fillSyntheticIdentity();
    fireEvent.change(q('total_price'), { target: { value: '2500000' } });
    fireEvent.click(screen.getByRole('button', { name: 'common.add' }));

    await waitFor(() => expect(network.post).toHaveBeenCalledTimes(1));
    const body = postedBody();
    expect(body).not.toHaveProperty('course_id');
    expect(body).toMatchObject({ total_price: 2500000, amount_paid: 0 });
  });
});

// Scoped write options (user with explicit permissions) return every course in
// the branch regardless of course_type; the form must still filter them.
describe('StudentModal scoped write options course_type filter (#342)', () => {
  const SCOPED_USER = {
    id: 'u-scoped',
    email: 'operator@example.test',
    role: 'operator',
    branch_id: 'b1',
    branch_ids: ['b1'],
    access_version: 1,
    permissions: [
      { permission: 'students.create', scope: 'branch', branch_id: 'b1' },
    ],
  };

  const serveScopedOptions = (courses: (typeof COURSE)[]) => {
    network.get.mockImplementation(async (url: string) => {
      if (url === '/permissions')
        return {
          data: {
            branches: [{ id: 'b1', name: 'Branch 1' }],
            permissions: [],
            templates: {},
            delegations: [],
            own_resources: [],
          },
        };
      if (url === '/permissions/options')
        return {
          data: {
            branches: [{ id: 'b1', name: 'Branch 1' }],
            courses,
            groups: [],
          },
        };
      throw new Error(`Unexpected GET ${url}`);
    });
  };

  const renderScoped = (courseType: CourseType) =>
    render(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: {
              queries: { retry: false },
              mutations: { retry: false },
            },
          })
        }
      >
        <ScopedCreate courseType={courseType} />
      </QueryClientProvider>,
    );

  const ScopedCreate = ({ courseType }: { courseType: CourseType }) => {
    const create = useCreateStudent();
    return (
      <StudentModal
        open
        onClose={vi.fn()}
        onSubmit={(body) => create.mutate(body)}
        loading={create.isPending}
        courseType={courseType}
        defaultBranchId="b1"
      />
    );
  };

  const optionsRequested = () =>
    network.get.mock.calls.some(([url]) => url === '/permissions/options');

  beforeEach(() => {
    auth.user = SCOPED_USER;
    // The read catalog must be ignored in scoped mode.
    catalog.courses = [];
  });

  const TEZKOR_SCOPED = {
    ...COURSE,
    id: 't-scoped',
    name: 'Tezkor scoped',
    course_type: 'tezkor',
    price: 3100000,
  };

  it.each([
    ['tezkor', TEZKOR_SCOPED, AVTO_COURSE],
    ['avto_maktab', AVTO_COURSE, TEZKOR_SCOPED],
  ] as const)(
    'with mixed-type options, a %s form offers, auto-selects and sends only its own course',
    async (courseType, own, other) => {
      // /permissions/options returns courses of BOTH types for the branch.
      serveScopedOptions([other, own]);
      network.post.mockResolvedValue({ data: { data: { id: 's-new' } } });
      renderScoped(courseType);

      await waitFor(() =>
        expect(digitsOnly(q('total_price').value)).toBe(String(own.price)),
      );
      const courseSelect = screen.getByRole('combobox', {
        name: 'students.sections.course',
      });
      // Auto-selected: the matching course, never the other-type one.
      expect(courseSelect).toHaveTextContent(own.name);
      expect(courseSelect).not.toHaveTextContent(other.name);
      fireEvent.click(courseSelect);
      expect(
        await screen.findByRole('option', { name: own.name }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('option', { name: other.name }),
      ).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('option', { name: own.name }));

      fillSyntheticIdentity();
      fireEvent.click(screen.getByRole('button', { name: 'common.add' }));

      await waitFor(() => expect(network.post).toHaveBeenCalledTimes(1));
      const body = postedBody();
      expect(body).toMatchObject({
        course_type: courseType,
        course_id: own.id,
        total_price: own.price,
        branch_id: 'b1',
      });
      expect(body.course_id).not.toBe(other.id);
    },
  );

  it('never shows, auto-selects or sends a sole course of the other course_type', async () => {
    serveScopedOptions([AVTO_COURSE]);
    network.post.mockResolvedValue({ data: { data: { id: 's-new' } } });
    renderScoped('tezkor');

    // Let the scoped options request resolve before asserting absence.
    await waitFor(() => expect(optionsRequested()).toBe(true));
    await waitFor(() =>
      expect(network.get.mock.results.every((r) => r.type === 'return')).toBe(
        true,
      ),
    );
    await Promise.all(network.get.mock.results.map((r) => r.value));

    const courseSelect = screen.getByRole('combobox', {
      name: 'students.sections.course',
    });
    expect(courseSelect).not.toHaveTextContent('Avto maktab B');
    expect(digitsOnly(q('total_price').value)).toBe('');
    fireEvent.click(courseSelect);
    expect(
      screen.queryByRole('option', { name: 'Avto maktab B' }),
    ).not.toBeInTheDocument();
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: 'Escape',
    });

    fillSyntheticIdentity();
    fireEvent.change(q('total_price'), { target: { value: '2500000' } });
    fireEvent.click(screen.getByRole('button', { name: 'common.add' }));

    await waitFor(() => expect(network.post).toHaveBeenCalledTimes(1));
    const body = postedBody();
    expect(body).toMatchObject({ course_type: 'tezkor', total_price: 2500000 });
    expect(body).not.toHaveProperty('course_id');
  });
});
