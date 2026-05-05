import { useCallback, useEffect, useRef, useState } from "react";

export function useTabsOverflow() {
  const listRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const checkOverflow = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setIsOverflowing(el.scrollWidth > el.clientWidth);
  }, []);

  useEffect(() => {
    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    if (listRef.current) observer.observe(listRef.current);
    return () => observer.disconnect();
  }, [checkOverflow]);

  return { listRef, isOverflowing };
}
