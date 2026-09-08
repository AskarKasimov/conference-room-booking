import { API_BASE_URL, WS_URL } from '../lib/env';

export function getRealtimeUrl(): string {
  if (WS_URL) return WS_URL;

  const url = new URL(API_BASE_URL);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/api/v1/ws';
  url.search = '';
  url.hash = '';
  return url.toString();
}
