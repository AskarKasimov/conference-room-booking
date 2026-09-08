import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it } from 'vitest';
import { AppProviders } from '../../src/app/providers/AppProviders';
import { AppRoutes } from '../../src/app/router';
import { createTestQueryClient } from '../support/renderWithProviders';

it('renders the BookRoom brand and the current user presentation', async () => {
  render(
    <AppProviders client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/rooms']}>
        <AppRoutes />
      </MemoryRouter>
    </AppProviders>,
  );

  expect(await screen.findByRole('link', { name: 'BookRoom' })).toHaveAttribute('href', '/rooms');
  expect(screen.getByRole('link', { name: 'Переговорные' })).toBeInTheDocument();
  expect(await screen.findByText('Константин Кузнецов')).toBeInTheDocument();
  expect(await screen.findByText('КК')).toBeInTheDocument();
});

it('renders the visual 404 recovery screen', async () => {
  render(
    <AppProviders client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/missing']}>
        <AppRoutes />
      </MemoryRouter>
    </AppProviders>,
  );

  expect(await screen.findByRole('heading', { name: 'Страница не найдена' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Вернуться к переговорным' })).toHaveAttribute(
    'href',
    '/rooms',
  );
});

it('vertically centers the primary navigation inside the header', async () => {
  render(
    <AppProviders client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/rooms']}>
        <AppRoutes />
      </MemoryRouter>
    </AppProviders>,
  );

  const navigation = await screen.findByRole('navigation', { name: 'Основная навигация' });
  expect(window.getComputedStyle(navigation).alignItems).toBe('center');
});

it('keeps the active-link underline on the bottom edge of a compact header', async () => {
  render(
    <AppProviders client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/rooms']}>
        <AppRoutes />
      </MemoryRouter>
    </AppProviders>,
  );

  const roomsLink = await screen.findByRole('link', { name: 'Переговорные' });
  const header = roomsLink.closest('header')!;
  expect(window.getComputedStyle(header).minHeight).toBe('4.5rem');
  expect(window.getComputedStyle(roomsLink).alignSelf).toBe('stretch');
});
