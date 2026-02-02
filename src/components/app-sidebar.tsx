"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Settings, ChevronLeft, FileText, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import LogoNav from "@/assets/logo-nav/logo-nav";
import { Separator } from "./ui/separator";
import {
  IconLayout,
  IconCalculator,
  IconTrolley,
  IconUsers,
  IconShieldLock,
} from "@tabler/icons-react";
import { useAuth } from "@/hooks/use-auth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: Array<"admin toko" | "admin sistem">;
}

const navItems: NavItem[] = [
  {
    label: "Beranda",
    href: "/dashboard",
    icon: <IconLayout className="w-5 h-5" />,
    roles: ["admin toko", "admin sistem"],
  },
  {
    label: "Kasir",
    href: "/dashboard/sales",
    icon: <IconCalculator className="w-5 h-5" />,
    roles: ["admin toko"],
  },
  {
    label: "Produk & Stok",
    href: "/dashboard/products",
    icon: <Package className="w-5 h-5" />,
    roles: ["admin toko"],
  },
  {
    label: "Pembelian & Supplier",
    href: "/dashboard/purchases",
    icon: <IconTrolley className="w-5 h-5" />,
    roles: ["admin toko"],
  },
  {
    label: "Pelanggan & Saldo",
    href: "/dashboard/customer",
    icon: <IconUsers className="w-5 h-5" />,
    roles: ["admin toko"],
  },
  {
    label: "Laporan",
    href: "/dashboard/report",
    icon: <FileText className="w-5 h-5" />,
    roles: ["admin toko"],
  },
  {
    label: "User & Akses",
    href: "/dashboard/users",
    icon: <IconShieldLock className="w-5 h-5" />,
    roles: ["admin sistem"],
  },
  {
    label: "Pengaturan",
    href: "/dashboard/setting",
    icon: <Settings className="w-5 h-5" />,
    roles: ["admin toko", "admin sistem"],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function AppSidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { roles } = useAuth();

  const filteredNavItems = navItems.filter((item) =>
    item.roles.some((role) => (roles as string[]).includes(role)),
  );

  return (
    <>
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
          <Separator className="mt-3" />
        </div>
        {/* Close button for mobile */}
        <div className="absolute right-[-16px] top-4">
          <Button
            variant="outline"
            size="icon"
            onClick={onToggle}
            className="text-sidebar-foreground cursor-pointer rounded-full bg-background dark:bg-sidebar-accent hover:bg-sidebar-accent"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </div>
        {/* Navigation */}
        <nav className="p-4">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      onToggle();
                    }
                  }}
                  className={cn(
                    "w-full flex items-center my-1 gap-3 px-4 py-2 cursor-pointer rounded-lg transition-colors",
                    isActive
                      ? "bg-primary/90 border-border shadow-lg via-primary to-primary/5 text-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  {item.icon}
                  <span className="font-regular">{item.label}</span>
                </button>
              </Link>
            );
          })}
          <Separator className="my-2" />
          <button
            disabled={!roles.length}
            className={cn(
              "w-full flex items-center my-1 gap-3 px-4 py-2 cursor-pointer rounded-lg transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              !roles.length && "opacity-50 cursor-not-allowed",
            )}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-regular">Keluar</span>
          </button>
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
