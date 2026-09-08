import { useEffect, useRef } from 'react';
import type { PropsWithChildren, RefObject } from 'react';
import { Button } from './Button';
import styles from './Dialog.module.scss';

interface DialogProps extends PropsWithChildren {
  open: boolean;
  title: string;
  description?: string;
  onOpenChange: (open: boolean) => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

export function Dialog({
  open,
  title,
  description,
  onOpenChange,
  returnFocusRef,
  children,
}: DialogProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (open) headingRef.current?.focus();
    else returnFocusRef?.current?.focus();
  }, [open, returnFocusRef]);
  if (!open) return null;
  return (
    <dialog
      open
      className={styles.dialog}
      aria-labelledby="dialog-title"
      aria-describedby={description ? 'dialog-description' : undefined}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onOpenChange(false);
        }
      }}
    >
      <div className={styles.content}>
        <div className={styles.header}>
          <h2 id="dialog-title" ref={headingRef} tabIndex={-1}>
            {title}
          </h2>
          <Button
            type="button"
            variant="ghost"
            aria-label="Закрыть"
            onClick={() => onOpenChange(false)}
          >
            ×
          </Button>
        </div>
        {description ? <p id="dialog-description">{description}</p> : null}
        {children}
      </div>
    </dialog>
  );
}
