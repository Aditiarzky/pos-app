"use client";

import { Bell, Menu, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import LogoNav from "@/assets/logo-nav/logo-nav";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

interface TopNavbarProps {
  onToggleSidebar: () => void;
  sidebarOpen?: boolean;
}

export function TopNavbar({ onToggleSidebar, sidebarOpen }: TopNavbarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-sm border-b border-border z-20 flex items-center justify-between px-4 md:pl-4 md:px-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
          <Menu className="w-5 h-5" />
        </Button>
        <div
          className={cn(
            "transition-all duration-300",
            sidebarOpen && "w-0 overflow-hidden",
          )}
        >
          <LogoNav height={32} type="nav" />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>
        <ThemeToggle />

        {/* Account Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  JD
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start text-xs">
                <span className="font-semibold text-foreground">John Doe</span>
                <span className="text-muted-foreground">Manager</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center gap-2 p-2">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                  JD
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  John Doe
                </p>
                <p className="text-xs text-muted-foreground">
                  john@example.com
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="w-4 h-4 mr-2" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
