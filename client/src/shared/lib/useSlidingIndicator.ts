import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

type IndicatorPosition = {
  left: number;
  width: number;
};

type IndicatorStyle = CSSProperties & {
  '--indicator-left': string;
  '--indicator-width': string;
};

export function useSlidingIndicator(activeKey: string, activeSelector = 'a[aria-current="page"]') {
  const containerRef = useRef<HTMLElement>(null);
  const [position, setPosition] = useState<IndicatorPosition>({ left: 0, width: 0 });
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const activeItem = container?.querySelector<HTMLElement>(activeSelector);
    if (!container || !activeItem) return;

    const updatePosition = () => {
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeItem.getBoundingClientRect();
      setPosition({ left: activeRect.left - containerRect.left, width: activeRect.width });
    };

    updatePosition();
    const frame = window.requestAnimationFrame(() => setReady(true));
    window.addEventListener('resize', updatePosition);

    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(updatePosition);
    resizeObserver?.observe(container);
    resizeObserver?.observe(activeItem);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', updatePosition);
      resizeObserver?.disconnect();
    };
  }, [activeKey, activeSelector]);

  const indicatorStyle: IndicatorStyle = {
    '--indicator-left': `${position.left}px`,
    '--indicator-width': `${position.width}px`,
  };

  return { containerRef, indicatorStyle, ready };
}
