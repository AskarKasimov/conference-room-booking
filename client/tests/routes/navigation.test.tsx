import { render, screen, waitFor } from '@testing-library/react';
import { RouterProvider } from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';
import { createAppRouter } from '../../src/router';

describe('application navigation', () => {
  it('redirects / to /rooms', async () => {
    const router = createAppRouter('/');
    render(<RouterProvider router={router} />);

    await waitFor(() => expect(router.state.location.pathname).toBe('/rooms'));
    expect(await screen.findByRole('heading', { name: 'Переговорные комнаты' })).toBeVisible();
  });

  it('shows the not-found page for an unknown URL', async () => {
    const router = createAppRouter('/missing');
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('heading', { name: 'Ничего не найдено' })).toBeVisible();
  });
});
