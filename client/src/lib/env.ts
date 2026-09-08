import { z } from 'zod';

const stripTrailingSlashes = (value: string) => value.replace(/\/+$/, '');

const clientEnvSchema = z
  .object({
    VITE_API_BASE_URL: z.url({ protocol: /^https?$/ }).transform(stripTrailingSlashes),
    VITE_WS_URL: z.url({ protocol: /^wss?$/ }).transform(stripTrailingSlashes),
    VITE_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(250).max(120_000).default(10_000),
  })
  .transform(({ VITE_API_BASE_URL, VITE_WS_URL, VITE_REQUEST_TIMEOUT_MS }) => ({
    API_BASE_URL: VITE_API_BASE_URL,
    WS_URL: VITE_WS_URL,
    REQUEST_TIMEOUT_MS: VITE_REQUEST_TIMEOUT_MS,
  }));

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export function parseClientEnv(raw: Record<string, unknown>): ClientEnv {
  const result = clientEnvSchema.safeParse(raw);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid client environment: ${details}`);
  }

  return result.data;
}

export const ENV = parseClientEnv(import.meta.env as unknown as Record<string, unknown>);
export const API_BASE_URL = ENV.API_BASE_URL;
export const WS_URL = ENV.WS_URL;
