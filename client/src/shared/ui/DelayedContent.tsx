import { useEffect, useState, type ReactNode } from 'react';

/** Keep the last settled view during brief requests, without allowing stale actions. */
export function DelayedContent({
  pending,
  fallback,
  children,
}: {
  pending: boolean;
  fallback: ReactNode;
  children?: ReactNode;
}) {
  const [previous, setPrevious] = useState<ReactNode>(null);
  const [showFallback, setShowFallback] = useState(false);

  if (!pending && previous !== children) {
    setPrevious(children);
  }

  useEffect(() => {
    if (!pending) {
      setShowFallback(false);
      return;
    }
    const timer = setTimeout(() => setShowFallback(true), 200);
    return () => clearTimeout(timer);
  }, [pending]);

  return (
    <div
      data-delayed-content
      style={{ display: 'contents' }}
      aria-busy={pending}
      inert={pending && !showFallback}
    >
      {pending ? (showFallback ? fallback : previous) : children}
    </div>
  );
}
