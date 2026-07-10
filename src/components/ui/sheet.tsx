"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  showHandle = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
  showHandle?: boolean
}) {
  const contentRef = React.useRef<HTMLDivElement>(null)
  const dragStartRef = React.useRef<number | null>(null)
  const currentTranslateRef = React.useRef(0)
  const isDraggingRef = React.useRef(false)

  // Axis and direction per side
  const isVertical = side === "bottom" || side === "top"
  const closeDirection = side === "bottom" ? 1 : side === "top" ? -1 : side === "right" ? 1 : -1

  const getPointerPos = (e: React.PointerEvent) =>
    isVertical ? e.clientY : e.clientX

  const applyTranslate = (px: number) => {
    const el = contentRef.current
    if (!el) return
    const axis = isVertical ? "Y" : "X"
    el.style.transform = `translate${axis}(${px}px)`
    el.style.transition = "none"
  }

  const resetTranslate = () => {
    const el = contentRef.current
    if (!el) return
    el.style.transform = ""
    el.style.transition = ""
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    // Hanya aktif di touch / stylus — bukan mouse
    if (e.pointerType === "mouse") return
    dragStartRef.current = getPointerPos(e)
    currentTranslateRef.current = 0
    isDraggingRef.current = false
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartRef.current === null) return
    const delta = (getPointerPos(e) - dragStartRef.current) * closeDirection
    // Hanya proses drag ke arah close, bukan sebaliknya
    if (delta <= 0) {
      if (isDraggingRef.current) resetTranslate()
      isDraggingRef.current = false
      return
    }
    isDraggingRef.current = true
    currentTranslateRef.current = delta * closeDirection
    // Tambah resistansi ringan — semakin jauh semakin berat
    const damped = delta * closeDirection * (1 - Math.min(delta / 600, 0.4))
    applyTranslate(damped)
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStartRef.current === null) return
    dragStartRef.current = null

    const el = contentRef.current
    if (!el || !isDraggingRef.current) {
      resetTranslate()
      return
    }

    const threshold = isVertical ? el.offsetHeight * 0.35 : el.offsetWidth * 0.35
    const delta = Math.abs(currentTranslateRef.current)

    if (delta >= threshold) {
      // Animasi keluar lalu trigger close via click X
      const axis = isVertical ? "Y" : "X"
      const fullDistance = isVertical ? el.offsetHeight : el.offsetWidth
      el.style.transform = `translate${axis}(${closeDirection * fullDistance}px)`
      el.style.transition = "transform 0.25s ease"
      setTimeout(() => {
        el.querySelector<HTMLButtonElement>("[data-sheet-close]")?.click()
      }, 220)
    } else {
      // Kembalikan ke posisi semula
      el.style.transition = "transform 0.3s ease"
      resetTranslate()
    }

    isDraggingRef.current = false
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  }

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={contentRef}
        data-slot="sheet-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
          side === "right" &&
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
          side === "left" &&
            "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
          side === "top" &&
            "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
          side === "bottom" &&
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
          className
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        {...props}
      >
        {/* Drag handle — hanya tampil di bottom/top sheet */}
        {showHandle && (side === "bottom" || side === "top") && (
          <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
        )}
        {children}
        <SheetPrimitive.Close
          data-sheet-close
          className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none"
        >
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
