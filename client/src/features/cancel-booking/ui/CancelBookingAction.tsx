import { useState } from 'react';
import { Button } from '../../../shared/ui';
import { useClock } from '../../../shared/lib';
import type { BookingView } from '../../../entities/booking';
import { CancelBookingDialog } from './CancelBookingDialog';

export function CancelBookingAction({
  booking,
  canCancel,
  currentUserId,
}: {
  booking: BookingView;
  canCancel: boolean;
  currentUserId?: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const now = useClock(Date.parse(booking.startsAt));
  const canCancelThisBooking =
    canCancel && booking.userId === currentUserId && Date.parse(booking.startsAt) > now.getTime();
  return (
    <>
      {canCancelThisBooking ? (
        <Button variant="danger" onClick={() => setOpen(true)}>
          Отменить
        </Button>
      ) : null}
      <CancelBookingDialog booking={booking} open={open} onOpenChange={setOpen} />
    </>
  );
}
