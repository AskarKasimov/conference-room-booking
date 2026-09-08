import '@testing-library/jest-dom/vitest';
import { transferableAbortController } from 'node:util';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { server } from './support/server';

// Node's fetch rejects jsdom AbortSignals; use constructors from the same runtime as fetch.
const nodeAbortController = transferableAbortController();
vi.stubGlobal('AbortController', nodeAbortController.constructor);
vi.stubGlobal('AbortSignal', nodeAbortController.signal.constructor);

window.scrollTo = () => undefined;
Element.prototype.hasPointerCapture = () => false;
Element.prototype.setPointerCapture = () => undefined;
Element.prototype.releasePointerCapture = () => undefined;
HTMLElement.prototype.scrollIntoView = () => undefined;

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

afterEach(() => {
  cleanup();
});
