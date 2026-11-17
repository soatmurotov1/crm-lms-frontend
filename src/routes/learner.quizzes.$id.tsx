/* eslint-disable react-refresh/only-export-components -- TanStack file routes export Route beside their component */
import { createFileRoute } from '@tanstack/react-router';
import { LearnerQuizPage } from '@/features/learner/pages/LearnerQuizzesPages';

export const Route = createFileRoute('/learner/quizzes/$id')({
  component: QuizRoute,
});

function QuizRoute() {
  const { id } = Route.useParams();
  return <LearnerQuizPage id={id} />;
}
