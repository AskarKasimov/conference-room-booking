import { describe, expect, it } from 'vitest';
import { parseClientEnv } from '../../src/lib/env';

describe('client environment', () => {
  it('parses URLs, booleans, and numeric settings', () => {
    expect(
      parseClientEnv({
        VITE_API_BASE_URL: ' https://api.example.com/ ',
        VITE_WS_URL: ' wss://api.example.com/api/v1/ws ',
        VITE_REQUEST_TIMEOUT_MS: '15000',
      }),
    ).toEqual({
      API_BASE_URL: 'https://api.example.com',
      WS_URL: 'wss://api.example.com/api/v1/ws',
      REQUEST_TIMEOUT_MS: 15000,
    });
  });

  it('uses safe defaults for optional settings', () => {
    expect(
      parseClientEnv({
        VITE_API_BASE_URL: 'http://localhost:3000',
        VITE_WS_URL: 'ws://localhost:3000/api/v1/ws',
      }),
    ).toMatchObject({
      API_BASE_URL: 'http://localhost:3000',
      WS_URL: 'ws://localhost:3000/api/v1/ws',
      REQUEST_TIMEOUT_MS: 10000,
    });
  });

  it('requires a WebSocket URL', () => {
    expect(() => parseClientEnv({ VITE_API_BASE_URL: 'http://localhost:3000' })).toThrow(
      'VITE_WS_URL',
    );
  });

  it.each([
    [{}, 'VITE_API_BASE_URL'],
    [{ VITE_API_BASE_URL: 'ftp://api.example.com' }, 'VITE_API_BASE_URL'],
    [
      { VITE_API_BASE_URL: 'https://api.example.com', VITE_WS_URL: 'https://api.example.com/ws' },
      'VITE_WS_URL',
    ],
    [
      {
        VITE_API_BASE_URL: 'https://api.example.com',
        VITE_WS_URL: 'wss://api.example.com/ws',
        VITE_REQUEST_TIMEOUT_MS: '0',
      },
      'VITE_REQUEST_TIMEOUT_MS',
    ],
  ])('rejects invalid values (%s)', (raw, field) => {
    expect(() => parseClientEnv(raw)).toThrow(field);
  });
});
