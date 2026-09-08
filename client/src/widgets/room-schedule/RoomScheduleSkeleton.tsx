import styles from './RoomScheduleWidget.module.scss';

export function RoomScheduleSkeleton({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <section
      className={styles.scheduleSkeleton}
      {...(ariaHidden
        ? { 'aria-hidden': true }
        : { role: 'status' as const, 'aria-label': 'Загрузка расписания…' })}
    >
      <div className={styles.scheduleSkeletonHeader}>
        <div>
          <i />
          <i />
        </div>
        <i />
      </div>
      <div className={styles.scheduleSkeletonTimeGrid}>
        {Array.from({ length: 12 }, (_, index) => (
          <div className={styles.scheduleSkeletonTimeRow} data-time-row key={index}>
            <span>{`${String(index + 9).padStart(2, '0')}:00`}</span>
            <i />
          </div>
        ))}
      </div>
      <i className={styles.scheduleSkeletonAction} />
    </section>
  );
}
