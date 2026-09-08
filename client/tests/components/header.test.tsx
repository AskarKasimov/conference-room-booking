import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { expect, it, vi } from 'vitest';
import { AppProviders } from '../../src/app/providers/AppProviders';
import { AppRoutes } from '../../src/app/router';
import { createTestQueryClient } from '../support/renderWithProviders';
import { server } from '../support/server';

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
  expect(await screen.findByText('Константин К.')).toBeInTheDocument();
  expect(screen.getByLabelText('Константин Кузнецов, КК')).toBeInTheDocument();
  expect(await screen.findByText('КК')).toBeInTheDocument();
});

it('renders the current user avatar when an avatar URL is available', async () => {
  server.use(
    http.get('*/api/v1/me', () =>
      HttpResponse.json({
        id: 'user-konstantin',
        login: 'kkuznetsov',
        displayName: 'Константин Кузнецов',
        email: 'kkuznetsov@example.test',
        avatarUrl: 'https://example.test/avatar.png',
        initials: 'КК',
      }),
    ),
  );

  render(
    <AppProviders client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/rooms']}>
        <AppRoutes />
      </MemoryRouter>
    </AppProviders>,
  );

  const avatar = await screen.findByRole('img', { name: 'Аватар пользователя' });
  expect(avatar).toHaveAttribute('src', 'https://example.test/avatar.png');
  expect(screen.getByText('КК').parentElement).toHaveAttribute('aria-hidden', 'true');
});

it('renders initials when the current user avatar fails to load', async () => {
  server.use(
    http.get('*/api/v1/me', () =>
      HttpResponse.json({
        id: 'user-konstantin',
        login: 'kkuznetsov',
        displayName: 'Константин Кузнецов',
        email: 'kkuznetsov@example.test',
        avatarUrl: 'https://example.test/missing-avatar.png',
        initials: 'КК',
      }),
    ),
  );

  render(
    <AppProviders client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/rooms']}>
        <AppRoutes />
      </MemoryRouter>
    </AppProviders>,
  );

  fireEvent.error(await screen.findByRole('img', { name: 'Аватар пользователя' }));
  expect(await screen.findByText('КК')).toBeInTheDocument();
  expect(screen.queryByRole('img', { name: 'Аватар пользователя' })).not.toBeInTheDocument();
});

it('shows an avatar skeleton while the current user is loading', async () => {
  let finishResponse!: () => void;
  const responseReady = new Promise<void>((resolve) => {
    finishResponse = resolve;
  });
  server.use(
    http.get('*/api/v1/me', async () => {
      await responseReady;
      return HttpResponse.json({
        id: 'user-konstantin',
        login: 'kkuznetsov',
        displayName: 'Константин Кузнецов',
        email: 'kkuznetsov@example.test',
        avatarUrl: null,
        initials: 'КК',
      });
    }),
  );

  render(
    <AppProviders client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/rooms']}>
        <AppRoutes />
      </MemoryRouter>
    </AppProviders>,
  );

  expect(screen.getByRole('status', { name: 'Загрузка аватара…' })).toBeInTheDocument();
  finishResponse();
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

it('moves the main navigation underline to the active route', async () => {
  const user = userEvent.setup();
  server.use(http.get('*/api/v1/bookings', () => HttpResponse.json({ items: [] })));
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    if (this.matches('[aria-label="Основная навигация"]')) {
      return {
        x: 100,
        y: 0,
        left: 100,
        right: 400,
        top: 0,
        bottom: 72,
        width: 300,
        height: 72,
        toJSON: () => ({}),
      };
    }
    if (this.matches('a[aria-current="page"]')) {
      const rooms = this.getAttribute('href') === '/rooms';
      const left = rooms ? 120 : 250;
      const width = rooms ? 90 : 130;
      return {
        x: left,
        y: 0,
        left,
        right: left + width,
        top: 0,
        bottom: 72,
        width,
        height: 72,
        toJSON: () => ({}),
      };
    }
    return {
      x: 0,
      y: 0,
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      width: 0,
      height: 0,
      toJSON: () => ({}),
    };
  });

  render(
    <AppProviders client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/rooms']}>
        <AppRoutes />
      </MemoryRouter>
    </AppProviders>,
  );

  const navigation = await screen.findByRole('navigation', { name: 'Основная навигация' });
  expect(navigation.querySelector('[aria-hidden="true"]')).toHaveStyle({
    '--indicator-left': '20px',
    '--indicator-width': '90px',
  });

  await user.click(screen.getByRole('link', { name: 'Мои бронирования' }));
  await screen.findByRole('heading', { name: 'Мои бронирования' });

  expect(
    screen
      .getByRole('navigation', { name: 'Основная навигация' })
      .querySelector('[aria-hidden="true"]'),
  ).toHaveStyle({
    '--indicator-left': '150px',
    '--indicator-width': '130px',
  });
});
