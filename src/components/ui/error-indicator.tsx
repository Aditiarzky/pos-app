import { Circle } from "lucide-react";

export function ErrorIndicator({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <Circle className="absolute top-2 right-2 h-2 w-2 fill-red-500 text-red-500 animate-pulse" />
  );
}
