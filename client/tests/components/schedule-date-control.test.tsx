import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { ScheduleDateControl } from '../../src/features/room-detail/ScheduleDateControl';

it('uses the shared calendar and prevents dates outside the schedule range', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(
    <ScheduleDateControl
      value="2026-09-10"
      min="2026-09-09"
      max="2026-09-11"
      onChange={onChange}
    />,
  );

  await user.click(screen.getByRole('button', { name: '10 Сентября, Чт' }));

  expect(screen.getByRole('button', { name: '11 Сентября, Пт' })).toBeEnabled();
  expect(screen.getByRole('button', { name: '12 Сентября, Сб' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: '11 Сентября, Пт' }));
  expect(onChange).toHaveBeenCalledWith('2026-09-11');
});
