"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Settings, ChevronLeft } from "lucide-react";
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
  IconReport,
  IconTrash,
  IconBell,
  IconDatabase,
  IconTax,
} from "@tabler/icons-react";
import { useAuth } from "@/hooks/use-auth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: Array<"admin toko" | "admin sistem">;
}

const STORE_AND_SYSTEM_ROLES: NavItem["roles"] = ["admin toko", "admin sistem"];
const SYSTEM_ADMIN_ONLY_ROLES: NavItem["roles"] = ["admin sistem"];

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Utama",
    items: [
      {
        label: "Beranda",
        href: "/dashboard",
        icon: <IconLayout className="w-5 h-5" />,
        roles: STORE_AND_SYSTEM_ROLES,
      },
      {
        label: "Kasir",
        href: "/dashboard/sales",
        icon: <IconCalculator className="w-5 h-5" />,
        roles: STORE_AND_SYSTEM_ROLES,
      },
    ],
  },
  {
    label: "Inventori",
    items: [
      {
        label: "Produk & Stok",
        href: "/dashboard/products",
        icon: <Package className="w-5 h-5" />,
        roles: STORE_AND_SYSTEM_ROLES,
      },
      {
        label: "Pembelian & Supplier",
        href: "/dashboard/purchases",
        icon: <IconTrolley className="w-5 h-5" />,
        roles: STORE_AND_SYSTEM_ROLES,
      },
      {
        label: "Pelanggan & Saldo",
        href: "/dashboard/customers",
        icon: <IconUsers className="w-5 h-5" />,
        roles: STORE_AND_SYSTEM_ROLES,
      },
    ],
  },
  {
    label: "Keuangan",
    items: [
      {
        label: "Operasional & Pajak",
        href: "/dashboard/cost",
        icon: <IconTax className="w-5 h-5" />,
        roles: SYSTEM_ADMIN_ONLY_ROLES,
      },
      {
        label: "Laporan",
        href: "/dashboard/report",
        icon: <IconReport className="w-5 h-5" />,
        roles: STORE_AND_SYSTEM_ROLES,
      },
    ],
  },
  {
    label: "Sistem",
    items: [
      {
        label: "Notifikasi",
        href: "/dashboard/notifications",
        icon: <IconBell className="w-5 h-5" />,
        roles: STORE_AND_SYSTEM_ROLES,
      },
      {
        label: "Tempat Sampah",
        href: "/dashboard/trash",
        icon: <IconTrash className="w-5 h-5" />,
        roles: STORE_AND_SYSTEM_ROLES,
      },
      {
        label: "User & Akses",
        href: "/dashboard/users",
        icon: <IconShieldLock className="w-5 h-5" />,
        roles: SYSTEM_ADMIN_ONLY_ROLES,
      },
      {
        label: "Master Data",
        href: "/dashboard/master-data",
        icon: <IconDatabase className="w-5 h-5" />,
        roles: SYSTEM_ADMIN_ONLY_ROLES,
      },
      {
        label: "Pengaturan",
        href: "/dashboard/setting",
        icon: <Settings className="w-5 h-5" />,
        roles: STORE_AND_SYSTEM_ROLES,
      },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function AppSidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { roles } = useAuth();

  const filterItems = (items: NavItem[]) =>
    items.filter((item) =>
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
        <Link href="/dashboard">
          <div className="pt-6 px-4">
            <LogoNav height={32} type="sidebar" />
            <Separator className="mt-3" />
          </div>
        </Link>

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
        <nav className="p-4 space-y-4">
          {navGroups.map((group) => {
            const visibleItems = filterItems(group.items);
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label}>
                {/* Group label */}
                <p className="px-4 mb-1 text-[10px] font-semibold tracking-widest uppercase text-sidebar-foreground/40 select-none">
                  {group.label}
                </p>

                {visibleItems.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <Link key={item.href} href={item.href}>
                      <button
                        onClick={() => {
                          if (window.innerWidth < 768) onToggle();
                        }}
                        className={cn(
                          "group relative w-full flex items-center my-0.5 gap-3 px-4 py-2 cursor-pointer rounded-lg transition-all duration-200",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                            : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        )}
                      >
                        {/* Active left indicator bar */}
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-primary-foreground/50" />
                        )}

                        {/* Icon */}
                        <span
                          className={cn(
                            "transition-transform duration-200 group-hover:scale-110",
                            isActive
                              ? "text-primary-foreground"
                              : "text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground",
                          )}
                        >
                          {item.icon}
                        </span>

                        <span className="text-sm font-medium">
                          {item.label}
                        </span>
                      </button>
                    </Link>
                  );
                })}
              </div>
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
