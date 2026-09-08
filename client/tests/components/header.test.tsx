import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { expect, it } from 'vitest';
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
