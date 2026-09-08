import { afterEach, describe, expect, it } from 'vitest';
import { buildTestApp, closeTestApps } from './helpers.js';

afterEach(closeTestApps);

describe('GET /health', () => {
  it('reports that the service is healthy', async () => {
    const app = await buildTestApp();
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('does not log health checks and keeps request logging for API routes', async () => {
    const logs: string[] = [];
    const app = await buildTestApp({
      logger: { stream: { write: (message) => logs.push(message) } },
    });

    await app.inject({ method: 'GET', url: '/health' });
    expect(logs.join('')).not.toContain('"url":"/health"');

    await app.inject({ method: 'GET', url: '/api/v1/me' });
    expect(logs.join('')).toContain('"url":"/api/v1/me"');
  });
});
