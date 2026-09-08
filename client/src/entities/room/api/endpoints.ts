import type { ItemsResponse } from '../../../shared/api';
import { request } from '../../../shared/api';
import type { RoomSummary, RoomWithOffice } from '../model/types';
import type { RoomListQuery } from './types';

export function listRooms(query: RoomListQuery) {
  return request<ItemsResponse<RoomSummary>>('/api/v1/rooms', { query });
}

export function getRoom(roomId: string) {
  return request<RoomWithOffice>(`/api/v1/rooms/${roomId}`);
}

export type { RoomListQuery } from './types';
