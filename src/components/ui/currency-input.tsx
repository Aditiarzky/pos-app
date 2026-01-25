import * as React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";
import { parseCurrency, formatCurrency } from "@/lib/format";

interface CurrencyInputProps extends Omit<
  React.ComponentProps<"input">,
  "onChange" | "value"
> {
  value: string | number;
  onChange: (value: string) => void;
}

export function CurrencyInput({
  value,
  onChange,
  className,
  ...props
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = React.useState("");

  React.useEffect(() => {
    if (value !== undefined && value !== null && value !== "") {
      const formatted = formatCurrency(value).replace("Rp", "").trim();
      setDisplayValue(formatted);
    } else {
      setDisplayValue("");
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = parseCurrency(e.target.value);
    if (rawValue === "" || !isNaN(Number(rawValue))) {
      onChange(rawValue);
    }
  };

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium pointer-events-none">
        Rp
      </div>
      <Input
        {...props}
        className={cn("pl-9", className)}
        value={displayValue}
        onChange={handleChange}
        placeholder="0"
      />
    </div>
  );
}
