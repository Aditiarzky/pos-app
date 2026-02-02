import * as React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";
import { parseCurrency, formatCurrency } from "@/lib/format";

interface CurrencyInputProps extends Omit<
  React.ComponentProps<"input">,
  "onChange" | "value"
> {
  // Ubah value menjadi number agar sinkron dengan state form
  value: number | undefined | null;
  // Ubah onChange untuk mengembalikan number
  onChange: (value: number) => void;
}

export function CurrencyInput({
  value,
  onChange,
  className,
  ...props
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = React.useState("");

  React.useEffect(() => {
    // Jika value adalah 0 atau angka, format untuk tampilan
    if (typeof value === "number") {
      const formatted = formatCurrency(value).replace("Rp", "").trim();
      setDisplayValue(formatted);
    } else {
      setDisplayValue("");
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawString = e.target.value;
    // Ambil angka saja dari string (menghapus titik ribuan)
    const numericString = rawString.replace(/[^0-9]/g, "");

    // Kirim sebagai number ke parent/form
    const numericValue = numericString === "" ? 0 : parseInt(numericString, 10);
    onChange(numericValue);
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
        // Tambahkan inputMode agar keyboard mobile memunculkan angka
        inputMode="numeric"
      />
    </div>
  );
}
