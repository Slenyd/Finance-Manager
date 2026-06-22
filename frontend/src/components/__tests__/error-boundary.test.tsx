import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../error-boundary';

const originalError = console.error;

beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
});

function ThrowOnRender({ error }: { error: Error }) {
  throw error;
  return null;
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Safe Content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Safe Content')).toBeInTheDocument();
  });

  it('shows error UI when child throws', () => {
    const testError = new Error('Test error message');

    render(
      <ErrorBoundary>
        <ThrowOnRender error={testError} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('shows Try Again button when an error occurs', () => {
    const testError = new Error('Test error');

    render(
      <ErrorBoundary>
        <ThrowOnRender error={testError} />
      </ErrorBoundary>,
    );

    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    expect(tryAgainButton).toBeInTheDocument();
  });
});
