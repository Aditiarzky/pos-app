"use client";

import React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  IconLayout,
  IconCalculator,
  IconTrolley,
  IconUsers,
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
    icon: <IconLayout className="w-6 h-6" />,
  },
  {
    label: "Produk",
    href: "/dashboard/products",
    icon: <Package className="w-6 h-6" />,
  },
  {
    label: "Kasir",
    href: "/dashboard/sales",
    icon: <IconCalculator className="w-6 h-6" />,
  },
  {
    label: "Pembelian",
    href: "/dashboard/purchases",
    icon: <IconTrolley className="w-6 h-6" />,
  },
  {
    label: "Laporan",
    href: "/dashboard/report",
    icon: <FileText className="w-6 h-6" />,
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
                "flex flex-col items-center justify-center py-2 px-2 h-full transition-colors",
                isActive
                  ? "text-primary border-t-2 border-primary bg-gradient-to-b from-primary/20 to-transparent"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.icon}
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
