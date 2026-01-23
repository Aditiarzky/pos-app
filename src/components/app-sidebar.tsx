"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  Settings,
  ChevronLeft,
  RotateCcw,
  FileText,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import LogoNav from "@/assets/logo-nav/logo-nav";
import { Separator } from "./ui/separator";
import {
  IconLayout,
  IconShoppingCart,
  IconTrolley,
  IconUsers,
} from "@tabler/icons-react";
interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}
const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <IconLayout className="w-5 h-5" />,
  },
  {
    label: "Kasir",
    href: "/dashboard/sales",
    icon: <IconShoppingCart className="w-5 h-5" />,
  },
  {
    label: "Barang & Stok",
    href: "/dashboard/products",
    icon: <Package className="w-5 h-5" />,
  },
  {
    label: "Supplier & Pembelian",
    href: "/dashboard/purchase",
    icon: <IconTrolley className="w-5 h-5" />,
  },
  {
    label: "Pelanggan & Saldo",
    href: "/dashboard/customer",
    icon: <IconUsers className="w-5 h-5" />,
  },
  {
    label: "Laporan",
    href: "/dashboard/report",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    label: "Pengaturan",
    href: "/dashboard/setting",
    icon: <Settings className="w-5 h-5" />,
  },
];
interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}
export function AppSidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  return (
    <>
      {/* Sidebar */}
      <div className="md:block hidden absolute right-4 left-4 top-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      </div>
      <div
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border transition-transform duration-300 z-40",
          isOpen
            ? "translate-x-0 w-64 md:relative"
            : "-translate-x-full -left-10 w-64",
        )}
      >
        <div className="pt-6 px-4">
          <LogoNav height={32} type="sidebar" />
          <Separator className="mt-6" />
        </div>
        {/* Close button for mobile */}
        <div className="absolute right-[-16px] top-4">
          <Button
            variant="outline"
            size="icon"
            onClick={onToggle}
            className="text-sidebar-foreground bg-background dark:bg-sidebar-accent hover:bg-sidebar-accent"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </div>
        {/* Navigation */}
        <nav className="p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  onClick={() => {
                    // Close sidebar on mobile when navigating
                    if (window.innerWidth < 768) {
                      onToggle();
                    }
                  }}
                  className={cn(
                    "w-full flex items-center my-1 gap-3 px-4 py-2 cursor-pointer rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  {item.icon}
                  <span className="font-regular">{item.label}</span>
                </button>
              </Link>
            );
          })}
        </nav>
      </div>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/50 backdrop-blur-sm z-30 md:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}
