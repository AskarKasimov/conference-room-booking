import { render, screen } from '@testing-library/react';
import { RouterProvider } from '@tanstack/react-router';
import { expect, it } from 'vitest';
import { AppProviders } from '../../src/app/AppProviders';
import { createAppRouter } from '../../src/router';
import { createTestQueryClient } from '../../src/test/renderWithProviders';

it('renders the BookRoom brand and the current user presentation', async () => {
  const router = createAppRouter('/rooms');
  render(
    <AppProviders client={createTestQueryClient()}>
      <RouterProvider router={router} />
    </AppProviders>,
  );

  expect(await screen.findByRole('link', { name: 'BookRoom' })).toHaveAttribute('href', '/rooms');
  expect(screen.getByRole('link', { name: 'Переговорные' })).toBeInTheDocument();
  expect(screen.getByText('Константин К.')).toBeInTheDocument();
  expect(screen.getByText('КК')).toBeInTheDocument();
});

it('renders the visual 404 recovery screen', async () => {
  const router = createAppRouter('/missing');
  render(
    <AppProviders client={createTestQueryClient()}>
      <RouterProvider router={router} />
    </AppProviders>,
  );

  expect(await screen.findByRole('heading', { name: 'Страница не найдена' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Вернуться к переговорным' })).toHaveAttribute(
    'href',
    '/rooms',
  );
});

it('vertically centers the primary navigation inside the header', async () => {
  const router = createAppRouter('/rooms');
  render(
    <AppProviders client={createTestQueryClient()}>
      <RouterProvider router={router} />
    </AppProviders>,
  );

  const navigation = await screen.findByRole('navigation', { name: 'Основная навигация' });
  expect(window.getComputedStyle(navigation).alignItems).toBe('center');
});

it('keeps the active-link underline on the bottom edge of a compact header', async () => {
  const router = createAppRouter('/rooms');
  render(
    <AppProviders client={createTestQueryClient()}>
      <RouterProvider router={router} />
    </AppProviders>,
  );

  const roomsLink = await screen.findByRole('link', { name: 'Переговорные' });
  const header = roomsLink.closest('header')!;
  expect(window.getComputedStyle(header).minHeight).toBe('4.5rem');
  expect(window.getComputedStyle(roomsLink).alignSelf).toBe('stretch');
});
