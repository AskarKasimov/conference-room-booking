import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { BookingsFilters } from '../../src/widgets/booking-list/BookingsFilters';

it('hides the office label while retaining an accessible name for the bookings filter', () => {
  render(
    <BookingsFilters
      value={undefined}
      onChange={vi.fn()}
      onDateRangeChange={vi.fn()}
      offices={[{ id: 'moscow', name: 'Москва', address: 'Тверская', timezone: 'Europe/Moscow' }]}
    />,
  );

  expect(screen.queryByText('Офис')).not.toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Офис' })).toHaveTextContent('Все офисы');
  expect(screen.getByRole('button', { name: 'Выбрать период' })).toHaveTextContent('За все время');
});
