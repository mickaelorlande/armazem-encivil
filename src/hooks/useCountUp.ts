import { useState, useEffect } from 'react';

/**
 * Animates a number from its previous value to `target` over `duration` ms.
 * Used for KPI cards (Stripe / Vercel Dashboard pattern).
 * Skipped automatically when prefers-reduced-motion is set.
 */
export function useCountUp(target: number, duration = 700): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
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
      // Ease-out cubic — fast start, soft landing
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return count;
}
