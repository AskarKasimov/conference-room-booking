import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { beforeAll, afterAll } from 'vitest';
import { server } from './server';

window.scrollTo = () => undefined;

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

afterEach(() => {
  cleanup();
});
