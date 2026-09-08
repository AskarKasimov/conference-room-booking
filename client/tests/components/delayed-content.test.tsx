import { act, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { DelayedContent } from '../../src/shared/ui/DelayedContent';

afterEach(() => vi.useRealTimers());

it('keeps the last result during a fast request without mounting a skeleton', () => {
  vi.useFakeTimers();
  const fallback = <div role="status">Загрузка</div>;
  const { rerender } = render(
    <DelayedContent pending={false} fallback={fallback}>
      Старый результат
    </DelayedContent>,
  );
  rerender(<DelayedContent pending fallback={fallback} />);
  expect(screen.getByText('Старый результат')).toBeInTheDocument();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.getByText('Старый результат').closest('[inert]')).toBeInTheDocument();
  act(() => {
    vi.advanceTimersByTime(100);
  });
  rerender(
    <DelayedContent pending={false} fallback={fallback}>
      Новый результат
    </DelayedContent>,
  );
  act(() => {
    vi.advanceTimersByTime(200);
  });
  expect(screen.getByText('Новый результат')).toBeInTheDocument();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

it('shows a skeleton only after 200 ms and resets the delay for the next request', () => {
  vi.useFakeTimers();
  const fallback = <div role="status">Загрузка</div>;
  const { rerender } = render(<DelayedContent pending fallback={fallback} />);
  act(() => {
    vi.advanceTimersByTime(199);
  });
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  act(() => {
    vi.advanceTimersByTime(1);
  });
  expect(screen.getByRole('status')).toBeInTheDocument();
  rerender(
    <DelayedContent pending={false} fallback={fallback}>
      Результат
    </DelayedContent>,
  );
  rerender(<DelayedContent pending fallback={fallback} />);
  expect(screen.getByText('Результат')).toBeInTheDocument();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
