import { useRef } from 'react';
import type { PropsWithChildren, RefObject } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from './Button';
import styles from './Dialog.module.scss';

interface DialogProps extends PropsWithChildren {
  open: boolean;
  title: string;
  description?: string;
  onOpenChange: (open: boolean) => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
  showClose?: boolean;
}

export function Dialog({
  open,
  title,
  description,
  onOpenChange,
  returnFocusRef,
  showClose = true,
  children,
}: DialogProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={styles.overlay} onClick={() => onOpenChange(false)} />
        <DialogPrimitive.Content
          className={styles.dialog}
          aria-describedby={description ? 'dialog-description' : undefined}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            headingRef.current?.focus();
          }}
          onCloseAutoFocus={() => returnFocusRef?.current?.focus()}
        >
          <div className={styles.content}>
            <div className={styles.header}>
              <DialogPrimitive.Title ref={headingRef} tabIndex={-1}>
                {title}
              </DialogPrimitive.Title>
              {showClose ? (
                <DialogPrimitive.Close asChild>
                  <Button type="button" variant="ghost" aria-label="Закрыть">
                    ×
                  </Button>
                </DialogPrimitive.Close>
              ) : null}
            </div>
            {description ? (
              <DialogPrimitive.Description id="dialog-description">
                {description}
              </DialogPrimitive.Description>
            ) : null}
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
