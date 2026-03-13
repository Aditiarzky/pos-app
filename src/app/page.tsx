'use client'

import LogoNav from "@/assets/logo-nav/logo-nav";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const navigate = useRouter();

  useEffect(() => {
    navigate.push("/login");
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <LogoNav type="nav" height={24} />
    </div>
  );
}
