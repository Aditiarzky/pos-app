/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React from "react";

import { useState, useEffect } from "react";
import { AppSidebar } from "./app-sidebar";
import { TopNavbar } from "./top-navbar";
import { BottomNavbar } from "./bottom-navbar";
import { useAuth } from "@/hooks/use-auth";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { logout, user } = useAuth();

  useEffect(() => {
    // Check if mobile on initial load
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    checkMobile();

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setIsScrolled(scrollTop > 10);
  };

  return (
    <div className="relative flex h-dvh min-h-0 overflow-hidden transition-all duration-300 animate-out dark:bg-background/80">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <DashedBackground />
      </div>
      <AppSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:ml-0">
        <TopNavbar
          user={user}
          onLogout={logout}
          onToggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
        />

        <main
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto pt-16 pb-16 md:pb-0"
        >
          {children}
        </main>
        <BottomNavbar />
      </div>
    </div>
  );
}

const DashedBackground = () => {
  return (
    <div className="relative h-full w-full">
      {/* Dashed Center Fade Grid */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
        linear-gradient(to right, #e7e5e4 1px, transparent 1px),
        linear-gradient(to bottom, #e7e5e4 1px, transparent 1px)
      `,
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 0",
          maskImage: `
       repeating-linear-gradient(
              to right,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            repeating-linear-gradient(
              to bottom,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
          radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)
      `,
          WebkitMaskImage: `
 repeating-linear-gradient(
              to right,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            repeating-linear-gradient(
              to bottom,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
          radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)
      `,
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      />
    </div>
  );
};
