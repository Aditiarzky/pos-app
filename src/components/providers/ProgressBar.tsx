"use client";
import { useEffect } from "react";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { usePathname, useSearchParams } from "next/navigation";

export default function ProvidersProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Configure NProgress once
    NProgress.configure({ showSpinner: false, speed: 400 });
  }, []);

  useEffect(() => {
    // Finish progress bar whenever the route fully loads
    NProgress.done();
  }, [pathname, searchParams]);

  useEffect(() => {
    // Intercept clicks on links to start the progress bar
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      
      if (anchor && anchor.href && anchor.target !== "_blank" && anchor.href.startsWith(window.location.origin)) {
        if (anchor.pathname === window.location.pathname && anchor.search === window.location.search) {
          // Same page, do nothing
          return;
        }
        NProgress.start();
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
