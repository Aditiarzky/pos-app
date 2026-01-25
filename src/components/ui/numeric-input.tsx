import * as React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface NumericInputProps extends Omit<
  React.ComponentProps<"input">,
  "onChange" | "value"
> {
  value: string | number;
  onChange: (value: string) => void;
  suffix?: string;
  decimalPlaces?: number;
}

export function NumericInput({
  value,
  onChange,
  className,
  suffix,
  decimalPlaces = 3,
  ...props
}: NumericInputProps) {
  // Internal state for what the user is typing (with comma)
  const [inputValue, setInputValue] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);

  // Sync internal state with external value
  React.useEffect(() => {
    if (value === undefined || value === null || value === "") {
      setInputValue("");
      return;
    }

    // Convert from external (dot) to internal (comma)
    const stringValue = value.toString();
    const [int, dec] = stringValue.split(".");

    if (isFocused) {
      // When focused, we want the raw characters the user is manipulating
      setInputValue(stringValue.replace(".", ","));
    } else {
      // When blurred, we can format it nicely
      const formattedDec = (dec || "")
        .padEnd(decimalPlaces, "0")
        .slice(0, decimalPlaces);
      setInputValue(`${int},${formattedDec}`);
    }
  }, [value, isFocused, decimalPlaces]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    // Normalize input: only numbers and one comma (or dot)
    // We allow dot but instantly convert it to comma for display
    val = val.replace(/\./g, ",");

    if (/^-?\d*,?\d*$/.test(val) || val === "") {
      setInputValue(val);

      // Send normalized value (with dot) back to parent
      const normalized = val.replace(/,/g, ".");
      onChange(normalized);
    }
  };

  // Split input value for rich display
  const [integerPart, decimalPart] = inputValue.split(",");
  const hasComma = inputValue.includes(",");

  return (
    <div className="relative group">
      {/* Visual Overlay for styling decimals */}
      {!isFocused && inputValue !== "" && (
        <div className="absolute inset-0 flex items-center px-3 text-sm pointer-events-none select-none">
          <span className="text-foreground">{integerPart}</span>
          {hasComma && (
            <>
              <span className="text-foreground">,</span>
              <span className="text-muted-foreground/40">{decimalPart}</span>
            </>
          )}
          {/* Suffix space */}
          {suffix && <span className="opacity-0 ml-1">{suffix}</span>}
        </div>
      )}

      <Input
        {...props}
        className={cn(
          suffix ? "pr-12" : "",
          !isFocused && inputValue !== ""
            ? "text-transparent caret-foreground"
            : "",
          className,
        )}
        value={inputValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        type="text"
        inputMode="decimal"
      />

      {suffix && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium pointer-events-none">
          {suffix}
        </div>
      )}
    </div>
  );
}
