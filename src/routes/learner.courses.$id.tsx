/* eslint-disable react-refresh/only-export-components -- TanStack file routes export Route beside their component */
import { createFileRoute } from '@tanstack/react-router';
import { LearnerCoursePage } from '@/features/learner/pages/LearnerCoursesPages';

export const Route = createFileRoute('/learner/courses/$id')({
  component: CourseRoute,
});

function CourseRoute() {
  const { id } = Route.useParams();
  return <LearnerCoursePage id={id} />;
}
