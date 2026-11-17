import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LearnerProfile } from '@/features/learner/types';

interface LearnerState {
  /** Faqat xotirada — sahifa yangilanganda sessiya cookie orqali tiklanadi. */
  token: string | null;
  profile: LearnerProfile | null;
  isAuthenticated: boolean;
  setSession: (token: string, profile: LearnerProfile) => void;
  setProfile: (profile: LearnerProfile) => void;
  logout: () => void;
}

export const useLearnerStore = create<LearnerState>()(
  persist(
    (set) => ({
      token: null,
      profile: null,
      isAuthenticated: false,
      setSession: (token, profile) =>
        set({ token, profile, isAuthenticated: true }),
      setProfile: (profile) => set({ profile, isAuthenticated: true }),
      logout: () => set({ token: null, profile: null, isAuthenticated: false }),
    }),
    {
      name: 'lms-learner',
      partialize: (state) => ({
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
