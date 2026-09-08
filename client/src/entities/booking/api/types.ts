export interface BookingListQuery {
  scope?: 'upcoming' | 'past' | 'all';
  officeId?: string;
}
