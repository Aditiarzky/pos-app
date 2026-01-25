"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

export function useQueryState<T extends string | number>(
  key: string,
  defaultValue: T,
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawValue = searchParams.get(key);
  const typedValue = (
    rawValue !== null
      ? typeof defaultValue === "number"
        ? Number(rawValue)
        : rawValue
      : defaultValue
  ) as T;

  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      const params = new URLSearchParams(window.location.search);

      const updatedValue =
        typeof newValue === "function"
          ? (newValue as any)(typedValue)
          : newValue;

      if (
        updatedValue === defaultValue ||
        updatedValue === "" ||
        updatedValue === undefined ||
        updatedValue === null
      ) {
        params.delete(key);
      } else {
        params.set(key, updatedValue.toString());
      }

      const queryString = params.toString();
      const url = queryString ? `${pathname}?${queryString}` : pathname;

      router.replace(url, { scroll: false });
    },
    [router, pathname, key, defaultValue, typedValue],
  );

  return [typedValue, setValue] as const;
}
