import styles from './Booking.module.scss';

export function BookingSuccessNotice() {
  return (
    <div className={styles.successNotice} role="status">
      <span aria-hidden="true">✓</span>
      <div>
        <strong>Бронирование создано</strong>
        <p>Переговорная добавлена в ваше расписание.</p>
      </div>
    </div>
  );
}
