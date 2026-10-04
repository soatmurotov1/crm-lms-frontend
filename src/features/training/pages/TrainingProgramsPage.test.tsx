import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TrainingProgramsPage from './TrainingProgramsPage';
import { renderWithRouter } from '@/test/utils/renderWithRouter';

const { programs } = vi.hoisted(() => ({ programs: vi.fn() }));
vi.mock('@/hooks/useCan', () => ({ useCan: () => false }));
vi.mock('@/features/branches/api/branchService', () => ({
  useBranches: () => ({ data: [] }),
}));
vi.mock('@/features/training/api/trainingService', () => ({
  useTrainingProgramsPage: programs,
  useCreateTrainingProgram: () => ({ isPending: false }),
  useUpdateTrainingProgram: () => ({ isPending: false }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('training program server search', () => {
  it('passes debounced URL search and renders authoritative server rows without filtering the page again', async () => {
    programs.mockReturnValue({
      data: {
        data: [
          {
            id: 'late-match',
            name: 'Authoritative result',
            category: 'B',
            course_type: 'tezkor',
            branch_id: 'b1',
            required_minutes: 120,
            is_active: true,
          },
        ],
        meta: { total: 1, totalPages: 1 },
      },
      isLoading: false,
    });
    const { router } = await renderWithRouter(<TrainingProgramsPage />, {
      initialEntry: '/training-programs?q=needle&page=3',
      routePattern: '/training-programs',
    });
    expect(screen.getByText('Authoritative result')).toBeInTheDocument();
    expect(programs).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'needle', page: 3 }),
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'AVTO_%\\' },
    });
    await waitFor(() =>
      expect(programs).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'AVTO_%\\', page: 1 }),
      ),
    );
    expect(router.state.location.search).toEqual(
      expect.objectContaining({ q: 'AVTO_%\\' }),
    );
  });
});
