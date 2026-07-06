"use client";

import { useEffect } from "react";

export default function ThemeInitializer() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      if (!savedTheme) {
        localStorage.setItem("theme", "light");
      }
    }
  }, []);

  return null;
}
