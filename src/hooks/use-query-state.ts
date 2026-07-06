"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Update the URL bar tanpa lewat Next.js router. Ini disengaja: memakai
 * router.replace()/router.push() dari next/navigation untuk perubahan query
 * string di App Router selalu memicu "soft navigation" — Next akan minta
 * ulang payload Server Component untuk route ini ke server, walau datanya
 * sama sekali tidak bergantung pada searchParams di sisi server (semua
 * fetching di aplikasi ini terjadi client-side lewat React Query).
 *
 * Round-trip itulah sumber "celah delay" yang terasa tiap ganti filter/page:
 * data di React Query sebenarnya sudah update instan (state lokal berubah
 * duluan), tapi ada kerja tambahan tak-terlihat berjalan di background akibat
 * sinkronisasi ke URL ini. Native history API mengubah address bar (tetap
 * bisa di-share / dipakai tombol back-forward) tanpa memicu Next melakukan
 * apa pun di baliknya.
 */
function replaceUrlSilently(url: string, scroll?: boolean) {
  if (typeof window === "undefined") return;
  window.history.replaceState(window.history.state, "", url);
  if (scroll) window.scrollTo(0, 0);
}

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
  },
) {
  const pathname = usePathname();
  // searchParams Next dipakai HANYA untuk nilai awal saat mount. Setelah itu
  // kita tidak boleh lagi bergantung padanya — lihat catatan di
  // replaceUrlSilently: karena kita menulis URL lewat native history API,
  // context searchParams milik Next tidak pernah tahu URL sudah berubah, dan
  // akan selalu terlihat "basi" dibanding localValue yang sebenarnya sudah
  // benar. Kalau tetap dipakai sebagai sumber sinkronisasi berkelanjutan, itu
  // yang menyebabkan bug harus klik dua kali (state baru langsung
  // "dikoreksi" balik ke nilai lama oleh efek sync ini).
  const searchParams = useSearchParams();
  const syncWithUrl = options?.syncWithUrl ?? true;
  const debounce = options?.debounce ?? 0;

  const [localValue, setLocalValue] = useState<T>(() => {
    const rawValue = searchParams.get(key);
    if (rawValue === null) return defaultValue;
    return (typeof defaultValue === "number" ? Number(rawValue) : rawValue) as T;
  });

  // Track the value we've pushed to the URL to avoid sync loops
  const lastPushedValue = useRef<T>(localValue);

  // Sync URL -> Local State — HANYA untuk event popstate asli (tombol
  // back/forward browser). Baca window.location.search langsung, BUKAN
  // useSearchParams() dari Next (lihat catatan di atas).
  useEffect(() => {
    if (!syncWithUrl) return;

    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      const rawValue = params.get(key);
      const urlValue = (
        rawValue === null
          ? defaultValue
          : typeof defaultValue === "number"
            ? Number(rawValue)
            : rawValue
      ) as T;

      if (urlValue !== lastPushedValue.current) {
        lastPushedValue.current = urlValue;
        setLocalValue(urlValue);
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [key, defaultValue, syncWithUrl]);

  // Sync Local State -> URL — lihat catatan di replaceUrlSilently di atas.
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
      replaceUrlSilently(url, options?.scroll ?? false);
    }, debounce);

    return () => clearTimeout(handler);
  }, [localValue, key, defaultValue, pathname, debounce, options?.scroll]);

  return [localValue, setLocalValue] as const;
}

/**
 * useQueryStates hook allows managing multiple query parameters at once.
 * Includes local state for immediate responsiveness.
 */
export function useQueryStates<
  T extends Record<string, string | number | undefined>,
>(
  defaultValues: T,
  options?: {
    scroll?: boolean;
  },
) {
  const pathname = usePathname();
  // Dipakai HANYA untuk nilai awal saat mount — lihat catatan panjang di
  // useQueryState di atas untuk alasan kenapa tidak boleh dipakai sebagai
  // sumber sinkronisasi berkelanjutan (itu penyebab bug "harus klik dua
  // kali").
  const searchParams = useSearchParams();

  // Bekukan defaultValues yang diberikan caller — mencegah kedua effect di
  // bawah re-run di setiap render komponen pemanggil hanya karena caller
  // memberi literal objek baru tiap kali (pola paling umum dipakai).
  const defaultValuesRef = useRef(defaultValues);

  const readUrlValues = useCallback(
    (search: { get(key: string): string | null }): T => {
      const dv = defaultValuesRef.current;
      const currentValues = { ...dv };
      Object.keys(dv).forEach((key) => {
        const rawValue = search.get(key);
        if (rawValue !== null) {
          currentValues[key as keyof T] = (
            typeof dv[key] === "number" ? Number(rawValue) : rawValue
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ) as any;
        }
      });
      return currentValues;
    },
    [],
  );

  const [localValues, setLocalValues] = useState<T>(() =>
    readUrlValues(searchParams),
  );
  const lastPushedValues = useRef<T>(localValues);

  // Sync URL -> Local State — HANYA untuk event popstate asli (tombol
  // back/forward browser). Baca window.location.search langsung, BUKAN
  // useSearchParams() dari Next.
  useEffect(() => {
    const onPopState = () => {
      const dv = defaultValuesRef.current;
      const urlValues = readUrlValues(
        new URLSearchParams(window.location.search),
      );
      const hasChanged = Object.keys(dv).some(
        (key) => urlValues[key] !== lastPushedValues.current[key],
      );
      if (hasChanged) {
        lastPushedValues.current = urlValues;
        setLocalValues(urlValues);
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [readUrlValues]);

  // Sync Local State -> URL — native history API, lihat catatan di
  // replaceUrlSilently di atas untuk alasannya.
  useEffect(() => {
    const dv = defaultValuesRef.current;
    const hasChanged = Object.keys(dv).some(
      (key) => localValues[key] !== lastPushedValues.current[key],
    );

    if (!hasChanged) return;

    // Use a small timeout to ensure we're not updating during render
    const handler = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);

      Object.entries(localValues).forEach(([key, value]) => {
        if (
          value === dv[key] ||
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
      replaceUrlSilently(url, options?.scroll ?? false);
    }, 0);

    return () => clearTimeout(handler);
  }, [localValues, pathname, options?.scroll]);

  const setValues = useCallback(
    (newValues: Partial<T> | ((prev: T) => Partial<T>)) => {
      setLocalValues((prev) => {
        const updated =
          typeof newValues === "function" ? newValues(prev) : newValues;
        return { ...prev, ...updated };
      });
    },
    [],
  );

  return [localValues, setValues] as const;
}
