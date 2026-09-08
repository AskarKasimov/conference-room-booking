import { http, HttpResponse } from 'msw';
import type { Office, RoomSummary } from '../api/contracts';

export const officeFixture: Office = {
  id: 'office-moscow',
  name: 'Москва-Сити',
  address: 'Пресненская наб., 8',
  timezone: 'Europe/Moscow',
};
export const roomFixture: RoomSummary = {
  id: 'room-everest',
  officeId: officeFixture.id,
  name: 'Эверест',
  floor: 12,
  capacity: 8,
  features: [{ code: 'screen', name: 'Экран' }],
  office: officeFixture,
  available: true,
};

export const handlers = [
  http.get('*/api/v1/offices', () => HttpResponse.json({ items: [officeFixture] })),
  http.get('*/api/v1/rooms', () => HttpResponse.json({ items: [roomFixture] })),
];
