import { createMemoryHistory, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

export function createAppRouter(initialEntry = '/') {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  });
}

export const router = createAppRouter();
