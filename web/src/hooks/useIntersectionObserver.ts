'use client';

import { useState, useEffect, useRef, RefObject } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
}

export function useIntersectionObserver<T extends HTMLElement>(
  options: UseIntersectionObserverOptions = {}
): [RefObject<T | null>, boolean] {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    triggerOnce = true,
    delay = 0,
  } = options;

  const elementRef = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => setIsVisible(true), delay);
          } else {
            setIsVisible(true);
          }

          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, delay]);

  return [elementRef, isVisible];
}

// 여러 요소의 스태거 애니메이션을 위한 훅
export function useStaggeredAnimation(
  itemCount: number,
  baseDelay: number = 100,
  options: Omit<UseIntersectionObserverOptions, 'delay'> = {}
): [RefObject<HTMLDivElement | null>, boolean[]] {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleItems, setVisibleItems] = useState<boolean[]>(
    Array(itemCount).fill(false)
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // 컨테이너가 보이면 순차적으로 아이템 표시
          Array.from({ length: itemCount }).forEach((_, index) => {
            setTimeout(() => {
              setVisibleItems((prev) => {
                const newState = [...prev];
                newState[index] = true;
                return newState;
              });
            }, index * baseDelay);
          });

          if (options.triggerOnce !== false) {
            observer.unobserve(container);
          }
        }
      },
      { threshold: options.threshold || 0.1, rootMargin: options.rootMargin || '0px' }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [itemCount, baseDelay, options.threshold, options.rootMargin, options.triggerOnce]);

  return [containerRef, visibleItems];
}

// 스크롤 진행률 추적 훅
export function useScrollProgress<T extends HTMLElement>(): [
  RefObject<T | null>,
  number
] {
  const elementRef = useRef<T>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // 요소가 뷰포트에 들어온 정도 계산 (0 ~ 1)
      const elementTop = rect.top;
      const elementHeight = rect.height;

      if (elementTop >= viewportHeight) {
        setProgress(0);
      } else if (elementTop + elementHeight <= 0) {
        setProgress(1);
      } else {
        const visiblePortion = Math.min(viewportHeight - elementTop, elementHeight);
        const progressValue = Math.max(0, Math.min(1, visiblePortion / elementHeight));
        setProgress(progressValue);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // 초기 상태 계산

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return [elementRef, progress];
}
