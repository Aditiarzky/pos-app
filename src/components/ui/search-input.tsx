import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ReactNode } from "react";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rightAction?: ReactNode;
};

export function SearchInput({
  value,
  onChange,
  placeholder = "Cari...",
  rightAction,
}: SearchInputProps) {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`pl-10 sm:text-base text-sm h-10 ${rightAction ? "pr-12" : ""}`}
      />
      {rightAction ? (
        <div className="absolute right-1 top-1/2 -translate-y-1/2">
          {rightAction}
        </div>
      ) : null}
    </div>
  );
}
