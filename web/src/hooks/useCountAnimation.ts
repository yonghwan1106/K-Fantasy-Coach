'use client';

import { useState, useEffect, useRef } from 'react';

interface UseCountAnimationOptions {
  duration?: number;
  delay?: number;
  decimals?: number;
  easing?: 'linear' | 'easeOut' | 'easeInOut';
}

export function useCountAnimation(
  endValue: number,
  options: UseCountAnimationOptions = {}
): number {
  const {
    duration = 1000,
    delay = 0,
    decimals = 0,
    easing = 'easeOut',
  } = options;

  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const easingFunctions = {
    linear: (t: number) => t,
    easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
    easeInOut: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  };

  useEffect(() => {
    const startAnimation = () => {
      const animate = (timestamp: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easingFunctions[easing](progress);

        const currentValue = easedProgress * endValue;
        setCount(Number(currentValue.toFixed(decimals)));

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const timeoutId = setTimeout(startAnimation, delay);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [endValue, duration, delay, decimals, easing]);

  return count;
}

// 여러 값을 동시에 애니메이션하는 훅
export function useMultiCountAnimation(
  values: { key: string; value: number; decimals?: number }[],
  options: Omit<UseCountAnimationOptions, 'decimals'> = {}
): Record<string, number> {
  const { duration = 1000, delay = 0, easing = 'easeOut' } = options;

  const [counts, setCounts] = useState<Record<string, number>>(() =>
    values.reduce((acc, { key }) => ({ ...acc, [key]: 0 }), {})
  );

  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const easingFunctions = {
    linear: (t: number) => t,
    easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
    easeInOut: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  };

  useEffect(() => {
    const startAnimation = () => {
      const animate = (timestamp: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easingFunctions[easing](progress);

        const newCounts = values.reduce((acc, { key, value, decimals = 0 }) => {
          const currentValue = easedProgress * value;
          return { ...acc, [key]: Number(currentValue.toFixed(decimals)) };
        }, {});

        setCounts(newCounts);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const timeoutId = setTimeout(startAnimation, delay);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [values, duration, delay, easing]);

  return counts;
}
