import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '../../src/app/AppProviders';
import { AppRoutes } from '../../src/router';
import { createTestQueryClient } from '../support/renderWithProviders';
import { server } from '../support/server';

function renderRoute(entry: string) {
  render(
    <AppProviders client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[entry]}>
        <AppRoutes />
      </MemoryRouter>
    </AppProviders>,
  );
}

describe('application navigation', () => {
  it('does not render breadcrumbs on the primary rooms route', async () => {
    renderRoute('/rooms');

    expect(await screen.findByRole('status', { name: 'Загрузка офисов…' })).toBeVisible();
    expect(
      screen.queryByRole('navigation', { name: 'Навигационная цепочка' }),
    ).not.toBeInTheDocument();
  });

  it('does not render breadcrumbs on the primary bookings route', async () => {
    server.use(http.get('*/api/v1/bookings', () => HttpResponse.json({ items: [] })));
    renderRoute('/bookings');

    expect(await screen.findByRole('status', { name: 'Загрузка бронирований…' })).toBeVisible();
    expect(
      screen.queryByRole('navigation', { name: 'Навигационная цепочка' }),
    ).not.toBeInTheDocument();
  });

  it('redirects / to /rooms', async () => {
    renderRoute('/');

    expect(
      await screen.findByRole('heading', { name: 'Доступные переговорные в этом офисе' }),
    ).toBeVisible();
  });

  it('shows the not-found page for an unknown URL', async () => {
    renderRoute('/missing');

    expect(await screen.findByRole('heading', { name: 'Страница не найдена' })).toBeVisible();
    expect(
      screen.queryByRole('navigation', { name: 'Навигационная цепочка' }),
    ).not.toBeInTheDocument();
  });

  it('uses the address-bar path when the application starts', async () => {
    renderRoute('/%D0%B0%D1%83%D0%B0');

    expect(await screen.findByRole('heading', { name: 'Страница не найдена' })).toBeVisible();
  });
});
