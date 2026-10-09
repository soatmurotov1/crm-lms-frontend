import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import SchoolTestDetailPage from './SchoolTestDetailPage';

const state = vi.hoisted(() => ({ isLoading: false }));
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ id: 'test' }),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'uz' } }),
}));
vi.mock('@/hooks/useCan', () => ({ useCan: () => false }));
vi.mock('@/features/branches/api/branchService', () => ({
  useBranches: () => ({ data: [] }),
}));
vi.mock('@/features/school-tests/api/schoolTestService', () => ({
  useTestTemplate: () => ({
    data: {
      id: 'test',
      title: 'Test',
      status: 'draft',
      questions: [],
      question_count: 0,
      time_limit_seconds: 60,
      passing_threshold_percent: 80,
      answer_review_timing: 'after',
    },
    isLoading: false,
  }),
  useTemplateAssignments: () => ({ isLoading: state.isLoading, data: [] }),
  usePublishTestTemplate: () => ({ mutate: vi.fn() }),
}));
vi.mock('@/features/school-tests/components/TestTemplateFormDialog', () => ({
  TestTemplateFormDialog: () => null,
}));
vi.mock('@/features/school-tests/components/AssignTestDialog', () => ({
  AssignTestDialog: () => null,
}));
afterEach(cleanup);

it('renders assignment loading skeleton rows in a Card with a translated status label', () => {
  state.isLoading = true;
  render(<SchoolTestDetailPage />);
  const status = screen.getByRole('status');
  expect(status).toHaveAttribute('aria-busy', 'true');
  expect(status.querySelector('.sr-only')).toHaveTextContent('common.loading');
  expect(status.querySelectorAll('.animate-pulse')).toHaveLength(2);
  expect(status.closest('.bg-card')).toHaveClass('border-border');
});

it('renders empty assignments inside a Card', () => {
  state.isLoading = false;
  render(<SchoolTestDetailPage />);
  expect(
    screen.getByText('school_tests.no_assignments').closest('.bg-card'),
  ).toHaveClass('border-border');
});
