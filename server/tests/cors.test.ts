import { afterAll, expect, it } from 'vitest';
import { buildTestApp, closeTestApps } from './helpers.js';

afterAll(closeTestApps);

it('allows the browser preflight for cancelling a booking', async () => {
  const app = await buildTestApp();
  const response = await app.inject({
    method: 'OPTIONS',
    url: '/api/v1/bookings/booking-1',
    headers: {
      origin: 'http://localhost:5173',
      'access-control-request-method': 'DELETE',
      'access-control-request-headers': 'content-type',
    },
  });

  expect(response.statusCode).toBe(204);
  expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  expect(response.headers['access-control-allow-methods']).toContain('DELETE');
  expect(response.headers['access-control-allow-headers']).toContain('content-type');
});
