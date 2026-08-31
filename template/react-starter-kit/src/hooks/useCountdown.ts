import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseCountdownOptions {
  intervalMs?: number
  onExpire?: () => void
}

export function useCountdown(initialSeconds = 0, options: UseCountdownOptions = {}) {
  const { intervalMs = 1000, onExpire } = options;
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const start = useCallback((seconds: number) => {
    setTimeLeft(seconds);
  }, []);

  const reset = useCallback(() => {
    setTimeLeft(0);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [timeLeft, intervalMs]);

  const formattedTime = `${Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`;

  return {
    timeLeft,
    formattedTime,
    isExpired: timeLeft === 0,
    isRunning: timeLeft > 0,
    start,
    reset,
  };
}
