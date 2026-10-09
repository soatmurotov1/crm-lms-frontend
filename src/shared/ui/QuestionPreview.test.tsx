import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { Question, QuestionVersion } from '@/features/questions/types';
import { QuestionPreview } from './QuestionPreview';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQuery: () => ({ data: null }),
}));
afterEach(cleanup);

const question = { id: 'q1', visibility: 'school_private' } as Question;
const version: QuestionVersion = {
  id: 'v1',
  version_number: 1,
  correct_option_key: 'B',
  source_url: null,
  legal_provision: null,
  diagram_media_id: null,
  published_at: null,
  created_at: '2026-10-08',
  locales: [
    {
      locale: 'uz',
      stem: 'Question',
      explanation: 'Explanation',
      options: [
        { option_key: 'A', text: 'First option', sort_order: 0 },
        { option_key: 'B', text: 'Second option', sort_order: 1 },
      ],
    },
  ],
};

it('identifies the correct answer with a labeled icon in addition to color', () => {
  const view = render(
    <QuestionPreview question={question} version={version} locale="uz" />,
  );
  const marker = screen.getByRole('img', { name: 'questions.correct_option' });
  expect(marker.parentElement).toHaveTextContent('Second option');
  expect(screen.getAllByRole('img')).toHaveLength(1);
  view.rerender(
    <QuestionPreview
      question={question}
      version={version}
      locale="uz"
      revealAnswer={false}
    />,
  );
  expect(
    screen.queryByRole('img', { name: 'questions.correct_option' }),
  ).not.toBeInTheDocument();
});
