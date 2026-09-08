import { render, screen, waitFor } from '@testing-library/react';
import { RouterProvider } from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '../../src/app/AppProviders';
import { createAppRouter } from '../../src/router';
import { createTestQueryClient } from '../../src/test/renderWithProviders';

describe('application navigation', () => {
  it('redirects / to /rooms', async () => {
    const router = createAppRouter('/');
    render(
      <AppProviders client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </AppProviders>,
    );

    await waitFor(() => expect(router.state.location.pathname).toBe('/rooms'));
    expect(await screen.findByRole('heading', { name: 'Переговорные комнаты' })).toBeVisible();
  });

  it('shows the not-found page for an unknown URL', async () => {
    const router = createAppRouter('/missing');
    render(
      <AppProviders client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </AppProviders>,
    );

    expect(await screen.findByRole('heading', { name: 'Ничего не найдено' })).toBeVisible();
  });
});
