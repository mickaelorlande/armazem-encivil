import { useState, useEffect } from 'react';

export function useCountUp(target: number | undefined, duration = 700): number | undefined {
  const [count, setCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (target === undefined) { setCount(undefined); return; }
    if (typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(target);
      return;
    }
    if (target === 0) { setCount(0); return; }

    const startTime = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return count;
}
