"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState, useRef } from "react";

/**
 * useQueryState hook provides a way to sync a state with URL query parameters.
 * Optimized for responsiveness and avoiding render-phase updates.
 */
export function useQueryState<T extends string | number>(
  key: string,
  defaultValue: T,
  options?: {
    debounce?: number;
    scroll?: boolean;
    syncWithUrl?: boolean;
  }
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const syncWithUrl = options?.syncWithUrl ?? true;
  const debounce = options?.debounce ?? 0;

  // Initialize from URL
  const getUrlValue = useCallback(() => {
    const rawValue = searchParams.get(key);
    if (rawValue === null) return defaultValue;
    return (typeof defaultValue === "number" ? Number(rawValue) : rawValue) as T;
  }, [searchParams, key, defaultValue]);

  const [localValue, setLocalValue] = useState<T>(getUrlValue);

  // Track the value we've pushed to the URL to avoid sync loops
  const lastPushedValue = useRef<T>(localValue);

  // Sync URL -> Local State (e.g. back/forward button)
  useEffect(() => {
    if (!syncWithUrl) return;
    const urlValue = getUrlValue();
    if (urlValue !== localValue && urlValue !== lastPushedValue.current) {
      setLocalValue(urlValue);
      lastPushedValue.current = urlValue;
    }
  }, [getUrlValue, syncWithUrl, localValue]);

  // Sync Local State -> URL
  useEffect(() => {
    if (localValue === lastPushedValue.current) return;

    const handler = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);

      if (
        localValue === defaultValue ||
        localValue === "" ||
        localValue === undefined ||
        localValue === null
      ) {
        params.delete(key);
      } else {
        params.set(key, localValue.toString());
      }

      const queryString = params.toString();
      const url = queryString ? `${pathname}?${queryString}` : pathname;

      lastPushedValue.current = localValue;
      router.replace(url, { scroll: options?.scroll ?? false });
    }, debounce);

    return () => clearTimeout(handler);
  }, [localValue, key, defaultValue, pathname, router, debounce, options?.scroll]);

  return [localValue, setLocalValue] as const;
}

/**
 * useQueryStates hook allows managing multiple query parameters at once.
 * Includes local state for immediate responsiveness.
 */
export function useQueryStates<T extends Record<string, string | number | undefined>>(
  defaultValues: T,
  options?: {
    scroll?: boolean;
  }
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize values from URL
  const getUrlValues = useCallback(() => {
    const currentValues = { ...defaultValues };
    Object.keys(defaultValues).forEach((key) => {
      const rawValue = searchParams.get(key);
      if (rawValue !== null) {
        currentValues[key as keyof T] = (typeof defaultValues[key] === "number"
          ? Number(rawValue)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          : rawValue) as any;
      }
    });
    return currentValues;
  }, [searchParams, defaultValues]);

  const [localValues, setLocalValues] = useState<T>(getUrlValues);
  const lastPushedValues = useRef<T>(localValues);

  // Sync URL -> Local State
  useEffect(() => {
    const urlValues = getUrlValues();
    const hasChanged = Object.keys(defaultValues).some(
      (key) => urlValues[key] !== localValues[key] && urlValues[key] !== lastPushedValues.current[key]
    );

    if (hasChanged) {
      setLocalValues(urlValues);
      lastPushedValues.current = urlValues;
    }
  }, [getUrlValues, localValues, defaultValues]);

  // Sync Local State -> URL
  useEffect(() => {
    const hasChanged = Object.keys(defaultValues).some(
      (key) => localValues[key] !== lastPushedValues.current[key]
    );

    if (!hasChanged) return;

    // Use a small timeout to ensure we're not updating during render
    const handler = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);

      Object.entries(localValues).forEach(([key, value]) => {
        if (
          value === defaultValues[key] ||
          value === "" ||
          value === undefined ||
          value === null ||
          (key === "page" && value === 1)
        ) {
          params.delete(key);
        } else {
          params.set(key, value.toString());
        }
      });

      const queryString = params.toString();
      const url = queryString ? `${pathname}?${queryString}` : pathname;

      lastPushedValues.current = localValues;
      router.replace(url, { scroll: options?.scroll ?? false });
    }, 0);

    return () => clearTimeout(handler);
  }, [localValues, defaultValues, pathname, router, options?.scroll]);

  const setValues = useCallback(
    (newValues: Partial<T> | ((prev: T) => Partial<T>)) => {
      setLocalValues((prev) => {
        const updated = typeof newValues === "function" ? newValues(prev) : newValues;
        return { ...prev, ...updated };
      });
    },
    []
  );

  return [localValues, setValues] as const;
}
