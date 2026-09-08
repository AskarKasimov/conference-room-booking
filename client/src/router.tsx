import { createBrowserHistory, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

function PendingApp() {
  return <main aria-label="Загрузка приложения" />;
}

export function createAppRouter(initialEntry = '/') {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
    defaultPendingComponent: PendingApp,
  });
}

export function createBrowserAppRouter() {
  return createRouter({
    routeTree,
    history: createBrowserHistory(),
    defaultPendingComponent: PendingApp,
  });
}

export const router = createBrowserAppRouter();
