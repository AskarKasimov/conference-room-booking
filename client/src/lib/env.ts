const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3000';

export const API_BASE_URL = apiBaseUrl.replace(/\/+$/, '');
export const WS_URL = import.meta.env.VITE_WS_URL?.trim() || undefined;
