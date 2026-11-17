import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '@/App';
import { getLoginCopy } from '@/features/auth/lib/loginCopy';
import { useAuthStore } from '@/store/authStore';

const copy = getLoginCopy('uz');

describe('homepage routing', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().logout();
  });

  it('shows anonymous visitors the landing page with the interactive demo', async () => {
    window.history.pushState({}, '', '/');

    render(<App />);

    expect(await screen.findByText('Rahbar paneli')).toBeInTheDocument();
    expect(screen.getAllByText(/Demoni ochish/).length).toBeGreaterThan(0);
  });

  it('still protects the dashboard route and sends anonymous users to login', async () => {
    window.history.pushState({}, '', '/dashboard');

    render(<App />);

    expect(await screen.findByText(copy.title)).toBeInTheDocument();
    expect(screen.getByText(copy.emailLabel)).toBeInTheDocument();
  });
});
