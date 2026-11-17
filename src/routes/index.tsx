import { lazy } from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/store/authStore';
import { getDefaultAuthenticatedRoute } from '@/lib/defaultAuthenticatedRoute';

const LandingPage = lazy(() => import('@/features/landing/pages/LandingPage'));

// Kirgan foydalanuvchi o'z paneliga o'tadi; mehmonlar esa bosh sahifada
// interaktiv demo (namuna ma'lumotlar) bilan landingni ko'radi.
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    if (isAuthenticated) {
      throw redirect({ to: getDefaultAuthenticatedRoute(user), replace: true });
    }
  },
  component: LandingPage,
});
