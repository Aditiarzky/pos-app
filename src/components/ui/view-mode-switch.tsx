"use client";

import { LayoutGrid, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ViewMode = "table" | "card";

type ViewModeSwitchProps = {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
};

export function ViewModeSwitch({
  value,
  onChange,
  className,
}: ViewModeSwitchProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-1 rounded-app-md border border-border bg-muted/30",
        className,
      )}
    >
      <Button
        type="button"
        variant={value === "table" ? "default" : "ghost"}
        size="icon-sm"
        className={cn(
          "rounded-app-sm p-0",
          value !== "table" &&
          "text-muted-foreground hover:bg-background hover:text-foreground",
        )}
        onClick={() => onChange("table")}
        title="Tampilan Tabel"
        aria-pressed={value === "table"}
      >
        <Table2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={value === "card" ? "default" : "ghost"}
        size="icon-sm"
        className={cn(
          "rounded-app-sm p-0",
          value !== "card" &&
          "text-muted-foreground hover:bg-background hover:text-foreground",
        )}
        onClick={() => onChange("card")}
        title="Tampilan Kartu"
        aria-pressed={value === "card"}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  );
}
