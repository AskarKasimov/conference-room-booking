import { request } from '../../../shared/api';
import type { User } from '../model/types';

export function getCurrentUser() {
  return request<User>('/api/v1/me');
}
