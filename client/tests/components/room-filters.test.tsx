import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RoomFilters } from '../../src/features/room-search/RoomFilters';

describe('RoomFilters', () => {
  it('emits numeric capacity and atomic filter values', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RoomFilters
        value={{ date: '2026-09-10', startTime: '10:00', duration: 60 }}
        onChange={onChange}
      />,
    );

    await user.selectOptions(screen.getByLabelText('Вместимость'), '8');

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ minCapacity: 8 }));
  });
});
