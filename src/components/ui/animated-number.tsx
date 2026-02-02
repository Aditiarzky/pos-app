"use client";

import { formatCompactNumber } from "@/lib/format";
import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 1000,
  className,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const startValueRef = useRef(displayValue);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = startValueRef.current;
    const endValue = value;
    let animationFrameId: number;

    if (startValue === endValue) return;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // Easing function: easeOutExpo
      const easing = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      const current = Math.floor(easing * (endValue - startValue) + startValue);

      setDisplayValue(current);
      startValueRef.current = current;

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);

  return <span className={className}>{formatCompactNumber(displayValue)}</span>;
}
