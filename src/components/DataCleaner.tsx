"use client";

import { useEffect, useRef } from "react";

export default function DataCleaner() {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    fetch("/api/clean-expired-data", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.deleted) {
          const total = Object.values(data.deleted).reduce((a: number, b: any) => a + (typeof b === 'number' ? b : 0), 0);
          if (total > 0) {
            console.log(`[DataCleaner] Cleaned ${total} expired records`, data.deleted);
          }
        }
      })
      .catch((err) => console.error("[DataCleaner] Error:", err));
  }, []);

  return null;
}
