"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronsDownIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ExpandableContainerProps {
  children: React.ReactNode;
  collapsedHeight?: string;
  expandedHeight?: string;
  className?: string;
}

export const ExpandableContainer = ({
  children,
  collapsedHeight = "max-h-[200px] sm:max-h-[120px]",
  expandedHeight = "max-h-[800px]",
  className,
}: ExpandableContainerProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [isMobile]);

  return (
    <div
      className={cn(
        "relative transition-all duration-500 ease-in-out overflow-hidden",
        isOpen
          ? `${expandedHeight} mb-4 pb-12`
          : `${collapsedHeight} mb-0 pb-0`,
        className,
      )}
    >
      <span
        className={cn(
          "absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background via-background/80 to-transparent z-20 pointer-events-none transition-opacity duration-300",
          isOpen ? "opacity-0" : "opacity-100",
        )}
      />

      {/* Konten Utama */}
      <div className="w-full">{children}</div>

      {/* Tombol Toggle */}
      <div
        className={cn(
          "absolute left-0 right-0 flex justify-center transition-all duration-500 z-30",
          isOpen ? "bottom-2" : "bottom-4",
        )}
      >
        <Button
          variant="outline"
          size="sm"
          className="rounded-full bg-primary/10 text-primary shadow-sm border-primary/20 hover:bg-primary/20"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "Tutup" : "Lihat Selengkapnya"}
          <ChevronsDownIcon
            className={cn(
              "ml-2 h-4 w-4 transition-transform duration-300",
              isOpen && "rotate-180",
            )}
          />
        </Button>
      </div>
    </div>
  );
};
