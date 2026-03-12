import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Skeleton } from "./skeleton"

type LoaderSize = "xs" | "sm" | "md" | "lg" | "xl"

const sizeMap: Record<LoaderSize, string> = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
}

export type LoaderProps = {
  size?: LoaderSize
  label?: string
  inline?: boolean
  className?: string
}

export function Loader({ size = "md", label, inline = true, className }: LoaderProps) {
  return (
    <span
      className={cn(
        "flex items-center gap-2",
        inline ? "flex-row" : "flex-col",
        className,
      )}
    >
      <Loader2
        className={cn(sizeMap[size], "animate-spin text-primary", inline ? "" : "text-lg")}
        aria-hidden
      />
      {label ? (
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      ) : null}
    </span>
  )
}

export type LoadingSkeletonListProps = {
  rows?: number
  gap?: string
  rowClassName?: string
  className?: string
}

export function LoadingSkeletonList({
  rows = 4,
  gap = "gap-2",
  rowClassName,
  className,
}: LoadingSkeletonListProps) {
  return (
    <div className={cn("flex flex-col", gap, className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className={cn("h-4 rounded-lg", rowClassName ?? "")}/>
      ))}
    </div>
  )
}

export type DashboardSkeletonProps = {
  className?: string
}

export function DashboardSummarySkeleton({ className }: DashboardSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-5 w-24" />
    </div>
  )
}

export function AlertSkeleton({ className }: DashboardSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}
