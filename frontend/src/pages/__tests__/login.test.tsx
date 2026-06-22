import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../login';

const mockMutate = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useAuth', () => ({
  useLogin: () => ({
    mutate: mockMutate,
    isPending: false,
    error: null,
  }),
}));

vi.mock('@/store/auth', () => ({
  useAuthStore: (selector?: (state: Record<string, unknown>) => unknown) => {
    const state = { isAuthenticated: false, user: null };
    return selector ? selector(state) : state;
  },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    mockMutate.mockClear();
  });

  it('renders email and password fields and submit button', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation errors when submitting with empty fields', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      const requiredElements = screen.getAllByText('Required');
      expect(requiredElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('calls the login mutation when form is submitted with valid data', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false,
      });
    });
  });
});
