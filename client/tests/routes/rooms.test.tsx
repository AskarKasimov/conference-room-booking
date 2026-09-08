import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppProviders } from '../../src/app/AppProviders';
import { createTestQueryClient } from '../support/renderWithProviders';
import { roomFixture, officeFixture } from '../support/handlers';
import { server } from '../support/server';
import { AppRoutes } from '../../src/router';

function renderRooms(entry = '/rooms') {
  render(
    <AppProviders client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[entry]}>
        <AppRoutes />
      </MemoryRouter>
    </AppProviders>,
  );
}

beforeEach(() => {
  server.use(http.get('*/api/v1/offices', () => HttpResponse.json({ items: [officeFixture] })));
});

describe('room search route', () => {
  it('separates the office controls from the available-rooms section', async () => {
    renderRooms(`/rooms?officeId=${officeFixture.id}`);

    expect(
      await screen.findByRole('heading', { name: 'Доступные переговорные в этом офисе' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Переговорные комнаты' })).not.toBeInTheDocument();
  });

  it('shows a dedicated no-office state and does not request rooms', async () => {
    let roomsRequested = false;
    server.use(
      http.get('*/api/v1/offices', () => HttpResponse.json({ items: [] })),
      http.get('*/api/v1/rooms', () => {
        roomsRequested = true;
        return HttpResponse.json({ items: [] });
      }),
    );

    renderRooms();

    expect(
      await screen.findByRole('heading', { name: 'Нет доступных офисов' }),
    ).toBeInTheDocument();
    expect(roomsRequested).toBe(false);
  });

  it('uses the first API office when the URL does not name one', async () => {
    let requestedUrl = '';
    server.use(
      http.get('*/api/v1/rooms', ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json({ items: [roomFixture] });
      }),
    );

    renderRooms();

    expect(await screen.findByRole('heading', { name: 'Эверест' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Выберите офис' })).not.toBeInTheDocument();
    expect(new URL(requestedUrl).searchParams.get('officeId')).toBe(officeFixture.id);
  });

  it('sends office, interval, and capacity after selecting an office', async () => {
    const user = userEvent.setup();
    let requestedUrl = '';
    server.use(
      http.get('*/api/v1/rooms', ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json({ items: [roomFixture] });
      }),
    );
    renderRooms();

    await user.click(await screen.findByRole('combobox', { name: 'Офис' }));
    await user.click(await screen.findByRole('option', { name: officeFixture.name }));
    await user.click(screen.getByRole('combobox', { name: 'Вместимость' }));
    await user.click(screen.getByRole('option', { name: '8 чел.' }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Эверест' })).toBeInTheDocument(),
    );
    expect(new URL(requestedUrl).searchParams.get('officeId')).toBe(officeFixture.id);
    expect(new URL(requestedUrl).searchParams.get('from')).toMatch(/T/);
    expect(new URL(requestedUrl).searchParams.get('to')).toMatch(/T/);
    expect(new URL(requestedUrl).searchParams.get('minCapacity')).toBe('8');
  });

  it('renders and retries an API error', async () => {
    let attempts = 0;
    server.use(
      http.get('*/api/v1/rooms', () => {
        attempts += 1;
        return attempts === 1
          ? HttpResponse.json(
              { error: { code: 'FAIL', message: 'Ошибка комнат' } },
              { status: 500 },
            )
          : HttpResponse.json({ items: [roomFixture] });
      }),
    );
    renderRooms(`/rooms?officeId=${officeFixture.id}`);

    expect(
      await screen.findByRole('heading', { name: 'Не удалось загрузить комнаты' }),
    ).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Повторить' }));
    expect(await screen.findByRole('heading', { name: 'Эверест' })).toBeInTheDocument();
    expect(attempts).toBe(2);
  });
});
