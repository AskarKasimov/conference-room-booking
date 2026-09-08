import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, request } from '../../src/shared/api/client';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const abortableFetch: typeof fetch = (_input, options) => {
  const signal = options?.signal;
  if (!signal) return Promise.resolve(new Response('{}'));
  return new Promise((_resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('The request was aborted', 'AbortError'));
      return;
    }
    signal.addEventListener(
      'abort',
      () => reject(new DOMException('The request was aborted', 'AbortError')),
      { once: true },
    );
  });
};

describe('API client', () => {
  it('loads a response through the HTTP test server with cancellation enabled', async () => {
    await expect(request('/api/v1/offices')).resolves.toMatchObject({
      items: [{ id: 'office-moscow', timezone: 'Europe/Moscow' }],
    });
  });

  it('cancels an in-flight request when its caller aborts', async () => {
    const controller = new AbortController();
    const result = request('/api/v1/rooms', { signal: controller.signal }, abortableFetch);
    const rejected = expect(result).rejects.toMatchObject({ name: 'AbortError' });

    controller.abort();

    await rejected;
  });

  it('honors a signal that was aborted before the request', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      request('/api/v1/rooms', { signal: controller.signal }, abortableFetch),
    ).rejects.toMatchObject({
      name: 'AbortError',
    });
  });

  it('aborts a request after the configured timeout', async () => {
    vi.useFakeTimers();
    const result = request('/api/v1/rooms', {}, abortableFetch);
    const rejected = expect(result).rejects.toMatchObject({ name: 'AbortError' });

    await Promise.all([rejected, vi.advanceTimersByTimeAsync(10_000)]);
    expect(vi.getTimerCount()).toBe(0);
  });

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
