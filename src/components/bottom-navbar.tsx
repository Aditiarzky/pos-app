"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  IconLayout,
  IconCalculator,
  IconTrolley,
  IconReport,
} from "@tabler/icons-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const mainNavItems: NavItem[] = [
  {
    label: "Beranda",
    href: "/dashboard",
    icon: <IconLayout className="w-5 h-5" />,
  },
  {
    label: "Produk",
    href: "/dashboard/products",
    icon: <Package className="w-5 h-5" />,
  },
  {
    label: "Kasir",
    href: "/dashboard/sales",
    icon: <IconCalculator className="w-5 h-5" />,
  },
  {
    label: "Pembelian",
    href: "/dashboard/purchases",
    icon: <IconTrolley className="w-5 h-5" />,
  },
  {
    label: "Laporan",
    href: "/dashboard/report",
    icon: <IconReport className="w-5 h-5" />,
  },
];

export function BottomNavbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-40 md:hidden flex items-center justify-around px-2">
      {mainNavItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} className="flex-1">
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-1 h-full transition-all duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {/* Icon pill */}
              <span
                className={cn(
                  "flex items-center justify-center rounded-full transition-all duration-200",
                  isActive ? "bg-primary/15 w-10 h-6 shadow-sm" : "w-6 h-6",
                )}
              >
                {item.icon}
              </span>

              <span
                className={cn(
                  "text-[10px] font-medium leading-none transition-all duration-200",
                  isActive ? "opacity-100" : "opacity-60",
                )}
              >
                {item.label}
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
