# Бронирование переговорных

Монорепозиторий состоит из независимых приложений: `server/` — mock-backend на Fastify, `client/` — React SPA на Vite. Клиент намеренно находится рядом с сервером, а не внутри него.

## Быстрый запуск

Требуется Node.js 20 или новее.

```bash
# terminal 1
cd server && npm ci && cp .env.example .env && npm run dev

# terminal 2
cd client && npm ci && cp .env.example .env && npm run dev
```

Клиент откроется на `http://localhost:5173`, API и WebSocket доступны на `http://localhost:3000` и `ws://localhost:3000/api/v1/ws`.

## Переменные окружения клиента

Файл `client/.env`:

| Переменная          | Значение в `.env.example` | Назначение                                        |
| ------------------- | ------------------------- | ------------------------------------------------- |
| `VITE_API_BASE_URL` | `http://localhost:3000`   | обязательный origin REST API                      |
| `VITE_WS_URL`       | из `VITE_API_BASE_URL`    | полный URL WebSocket; если задан, имеет приоритет |

## Команды

```bash
cd client
npm test
npm run check

cd ../server
npm test
npm run check
```

`client npm run check` выполняет Prettier, ESLint, строгую проверку TypeScript, все тесты и production build. В клиентских тестах HTTP заменён MSW, WebSocket — mock factory; реальный сервер не требуется.

## Маршруты

- `/rooms` — выбор офиса, даты, времени, длительности и вместимости, список комнат;
- `/rooms/:roomId` — сведения о комнате и расписание рабочего дня;
- `/bookings` — предстоящие/прошедшие бронирования, фильтр офиса и отмена;
- неизвестные пути — доступная страница 404.

Архитектурные причины решений описаны в [docs/architecture.md](docs/architecture.md) и [docs/decisions.md](docs/decisions.md). Ручной сценарий проверки двух окон и адаптивности находится в [client/tests/e2e-manual-checklist.md](client/tests/e2e-manual-checklist.md).
