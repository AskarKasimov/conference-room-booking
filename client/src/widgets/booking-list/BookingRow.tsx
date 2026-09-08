import { BookingCard, type BookingView } from '../../entities/booking';
import { CancelBookingAction } from '../../features/cancel-booking';

export function BookingRow({
  booking,
  canCancel,
  currentUserId,
}: {
  booking: BookingView;
  canCancel: boolean;
  currentUserId?: string | undefined;
}) {
  return (
    <BookingCard
      booking={booking}
      action={
        <CancelBookingAction
          booking={booking}
          canCancel={canCancel}
          currentUserId={currentUserId}
        />
      }
    />
  );
}
