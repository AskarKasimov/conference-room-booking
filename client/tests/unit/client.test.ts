import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, request } from '../../src/api/client';

afterEach(() => vi.restoreAllMocks());

describe('API client', () => {
  it('omits undefined query parameters', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ items: [] }), { status: 200 }));

    await request('/api/v1/rooms', { query: { officeId: 'moscow', from: undefined } });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/rooms?officeId=moscow',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('sets JSON content type for mutations', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 201 }));

    await request('/api/v1/bookings', { method: 'POST', body: { title: 'Standup' } });

    const options = fetchMock.mock.calls[0]?.[1];
    expect(new Headers(options?.headers).get('content-type')).toBe('application/json');
    expect(options?.body).toBe(JSON.stringify({ title: 'Standup' }));
  });

  it('returns undefined for a 204 response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

    await expect(
      request('/api/v1/bookings/booking-1', { method: 'DELETE' }),
    ).resolves.toBeUndefined();
  });

  it('maps the API error envelope to ApiError', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: 'BOOKING_CONFLICT', message: 'Занято', details: { roomId: 'r1' } },
        }),
        { status: 409 },
      ),
    );

    await expect(request('/api/v1/bookings', { method: 'POST', body: {} })).rejects.toMatchObject({
      status: 409,
      code: 'BOOKING_CONFLICT',
      message: 'Занято',
      details: { roomId: 'r1' },
    } satisfies Partial<ApiError>);
  });
});
