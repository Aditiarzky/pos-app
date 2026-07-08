import * as React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<
  React.ComponentProps<"input">,
  "onChange" | "value"
> {
  // Ubah value menjadi number agar sinkron dengan state form
  value: string | number | undefined | null;
  // Ubah onChange untuk mengembalikan number
  onChange: (value: number) => void;
}

export function CurrencyInput({
  value,
  onChange,
  className,
  ...props
}: CurrencyInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [displayValue, setDisplayValue] = React.useState("");
  const nextCaretPosRef = React.useRef<number | null>(null);

  const formatDigits = React.useCallback((digits: string) => {
    if (!digits) return "";
    return new Intl.NumberFormat("id-ID").format(Number(digits));
  }, []);

  const caretPositionForDigitCount = React.useCallback(
    (formattedValue: string, digitCount: number) => {
      if (digitCount <= 0) return 0;

      let digitsSeen = 0;
      for (let i = 0; i < formattedValue.length; i++) {
        if (/\d/.test(formattedValue[i])) {
          digitsSeen += 1;
          if (digitsSeen === digitCount) {
            return i + 1;
          }
        }
      }

      return formattedValue.length;
    },
    [],
  );

  React.useEffect(() => {
    // Hanya sinkronkan dari prop `value` ke display saat input TIDAK sedang difokus.
    // Kalau input sedang difokus, state display dikelola oleh handleChange
    // agar posisi karet tidak direset di tengah pengetikan.
    const isFocused = document.activeElement === inputRef.current;
    if (isFocused) return;

    if (value !== undefined && value !== null && value !== "") {
      const numValue = typeof value === "string" ? parseFloat(value) : value;
      const formatted = formatDigits(String(Math.trunc(numValue)));
      setDisplayValue(formatted);
    } else {
      setDisplayValue("");
    }
  }, [value, formatDigits]);

  React.useLayoutEffect(() => {
    const input = inputRef.current;
    const nextCaretPos = nextCaretPosRef.current;
    if (!input || nextCaretPos === null) return;

    const isFocused = document.activeElement === input;
    if (!isFocused) {
      nextCaretPosRef.current = null;
      return;
    }

    const clampedPos = Math.max(0, Math.min(nextCaretPos, input.value.length));
    input.setSelectionRange(clampedPos, clampedPos);
    nextCaretPosRef.current = null;
  }, [displayValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawString = e.target.value;
    const caretPos = e.target.selectionStart ?? rawString.length;
    const digitsBeforeCaret = rawString
      .slice(0, caretPos)
      .replace(/[^0-9]/g, "").length;
    // Ambil angka saja dari string (menghapus titik ribuan)
    const numericString = rawString.replace(/[^0-9]/g, "");
    const formattedValue = formatDigits(numericString);

    // Kirim sebagai number ke parent/form
    const numericValue = numericString === "" ? 0 : parseInt(numericString, 10);
    nextCaretPosRef.current = caretPositionForDigitCount(
      formattedValue,
      digitsBeforeCaret,
    );
    setDisplayValue(formattedValue);
    onChange(numericValue);
  };

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium pointer-events-none">
        Rp
      </div>
      <Input
        ref={inputRef}
        {...props}
        className={cn("pl-9", className)}
        value={displayValue}
        onChange={handleChange}
        placeholder="0"
        // Tambahkan inputMode agar keyboard mobile memunculkan angka
        inputMode="numeric"
      />
    </div>
  );
}
