'use client';

import { useRef, useCallback, useEffect } from 'react';

interface SwipeConfig {
  threshold?: number;
  preventDefault?: boolean;
}

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
}

export default function useSwipeGesture(
  handlers: SwipeHandlers,
  config: SwipeConfig = {}
) {
  const { threshold = 50, preventDefault = true } = config;
  const touchState = useRef<TouchState | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
    };
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (preventDefault && touchState.current) {
      // Only prevent default if it looks like a horizontal swipe
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchState.current.startX);
      const deltaY = Math.abs(touch.clientY - touchState.current.startY);

      if (deltaX > deltaY && deltaX > 10) {
        e.preventDefault();
      }
    }
  }, [preventDefault]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchState.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchState.current.startX;
    const deltaY = touch.clientY - touchState.current.startY;
    const deltaTime = Date.now() - touchState.current.startTime;

    // Velocity check - faster swipes have lower threshold
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;
    const effectiveThreshold = velocity > 0.5 ? threshold * 0.5 : threshold;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Horizontal swipe
    if (absX > absY && absX > effectiveThreshold) {
      if (deltaX > 0) {
        handlers.onSwipeRight?.();
      } else {
        handlers.onSwipeLeft?.();
      }
    }
    // Vertical swipe
    else if (absY > absX && absY > effectiveThreshold) {
      if (deltaY > 0) {
        handlers.onSwipeDown?.();
      } else {
        handlers.onSwipeUp?.();
      }
    }

    touchState.current = null;
  }, [handlers, threshold]);

  const setRef = useCallback((element: HTMLElement | null) => {
    if (elementRef.current) {
      elementRef.current.removeEventListener('touchstart', handleTouchStart);
      elementRef.current.removeEventListener('touchmove', handleTouchMove);
      elementRef.current.removeEventListener('touchend', handleTouchEnd);
    }

    elementRef.current = element;

    if (element) {
      element.addEventListener('touchstart', handleTouchStart, { passive: true });
      element.addEventListener('touchmove', handleTouchMove, { passive: false });
      element.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  useEffect(() => {
    return () => {
      if (elementRef.current) {
        elementRef.current.removeEventListener('touchstart', handleTouchStart);
        elementRef.current.removeEventListener('touchmove', handleTouchMove);
        elementRef.current.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return setRef;
}

// Utility hook for detecting mobile viewport
export function useIsMobile(breakpoint: number = 768) {
  const checkIsMobile = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoint;
  }, [breakpoint]);

  const isMobileRef = useRef(false);

  useEffect(() => {
    isMobileRef.current = checkIsMobile();

    const handleResize = () => {
      isMobileRef.current = checkIsMobile();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkIsMobile]);

  return isMobileRef.current;
}

// Hook for detecting touch device
export function useIsTouchDevice() {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Hook for handling pull-to-refresh
interface PullToRefreshConfig {
  threshold?: number;
  onRefresh: () => Promise<void> | void;
}

export function usePullToRefresh(config: PullToRefreshConfig) {
  const { threshold = 80, onRefresh } = config;
  const startYRef = useRef<number | null>(null);
  const pullDistanceRef = useRef(0);
  const isRefreshingRef = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      startYRef.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (startYRef.current === null || isRefreshingRef.current) return;

    const currentY = e.touches[0].clientY;
    pullDistanceRef.current = Math.max(0, currentY - startYRef.current);

    if (pullDistanceRef.current > 0 && window.scrollY === 0) {
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistanceRef.current >= threshold && !isRefreshingRef.current) {
      isRefreshingRef.current = true;
      await onRefresh();
      isRefreshingRef.current = false;
    }
    startYRef.current = null;
    pullDistanceRef.current = 0;
  }, [threshold, onRefresh]);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    pullDistance: pullDistanceRef.current,
    isRefreshing: isRefreshingRef.current,
  };
}
