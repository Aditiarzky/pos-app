import { cn } from "@/lib/utils";
import React from "react";

interface StickyCardGridProps {
  children: React.ReactNode;
  className?: string;
}

// Wrapper Utama (Section)
export const StickyCardGrid = ({
  children,
  className,
}: StickyCardGridProps) => {
  return (
    <section
      className={cn(
        "relative isolate space-y-6 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6",
        className,
      )}
    >
      {children}
    </section>
  );
};

interface StickyCardItemProps {
  children: React.ReactNode;
  topOffset?: string; // e.g. "top-4", "top-8"
  zIndex?: string; // e.g. "z-10", "z-20"
  className?: string;
}

// Wrapper Per Card (Div)
export const StickyCardItem = ({
  children,
  topOffset = "top-4",
  zIndex = "z-10",
  className,
}: StickyCardItemProps) => {
  return (
    <div className={cn("sticky md:static", topOffset, zIndex, className)}>
      {children}
    </div>
  );
};

interface StickyCardStackProps {
  children: React.ReactNode;
  className?: string;
  /** Jarak tumpukan antar card dalam satuan tailwind, misal 4 (1rem) atau 8 (2rem) */
  offsetStep?: number;
}

export const StickyCardStack = ({
  children,
  className,
  offsetStep = 4,
}: StickyCardStackProps) => {
  // Mengonversi children ke array agar bisa di-map
  const cards = React.Children.toArray(children);

  return (
    <section
      className={cn(
        "relative isolate space-y-6 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6",
        className,
      )}
    >
      {cards.map((card, index) => {
        // Kalkulasi otomatis: index 0 -> top-4, index 1 -> top-8, dst.
        const topValue = (index + 1) * offsetStep;
        const zIndex = (index + 1) * 10;

        return (
          <div
            key={index}
            className="sticky md:static"
            style={{
              top: `calc(${topValue}px * 4)`, // Menggunakan inline style agar lebih presisi
              zIndex: zIndex,
            }}
          >
            {card}
          </div>
        );
      })}
    </section>
  );
};
