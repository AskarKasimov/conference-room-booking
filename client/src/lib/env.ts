const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

if (!apiBaseUrl) {
  throw new Error('VITE_API_BASE_URL is required. Copy client/.env.example to client/.env.');
}

export const API_BASE_URL = apiBaseUrl.replace(/\/+$/, '');
export const WS_URL = import.meta.env.VITE_WS_URL?.trim() || undefined;
