import type { ItemsResponse } from '../../../shared/api';
import { request } from '../../../shared/api';
import type { Office } from '../model/types';

export function listOffices() {
  return request<ItemsResponse<Office>>('/api/v1/offices');
}
