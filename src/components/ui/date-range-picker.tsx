"use client";

import { useMemo } from "react";
import { format, isAfter, startOfDay } from "date-fns";
import { id } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  value: DateRange | undefined;
  onChange: (value: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  popoverContentClassName?: string;
  disabled?: (date: Date) => boolean;
  numberOfMonths?: number;
  captionLayout?: "label" | "dropdown" | "dropdown-months" | "dropdown-years" | undefined;
}

export const DateRangePicker = ({
  value,
  onChange,
  placeholder = "Pilih rentang tanggal",
  className,
  buttonClassName,
  popoverContentClassName,
  disabled,
  numberOfMonths = 1,
  captionLayout = "dropdown",
}: DateRangePickerProps) => {
  const today = useMemo(() => startOfDay(new Date()), []);
  const isDisabled =
    disabled ?? ((date: Date) => isAfter(date, today));

  const displayValue = useMemo(() => {
    if (value?.from && value?.to) {
      return `${format(value.from, "dd/MM/yyyy")} - ${format(value.to, "dd/MM/yyyy")}`;
    }

    if (value?.from) {
      return `${format(value.from, "dd/MM/yyyy")} - ...`;
    }

    return placeholder;
  }, [placeholder, value]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-9 text-xs",
            !value?.from && "text-muted-foreground",
            buttonClassName,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-auto p-0", popoverContentClassName)}
        align="start"
      >
        <Calendar
          mode="range"
          selected={value}
          onSelect={onChange}
          numberOfMonths={numberOfMonths}
          captionLayout={captionLayout}
          disabled={isDisabled}
          locale={id}
          className={cn(className, "[--cell-size:--spacing(8)]")}
          formatters={{
            formatMonthDropdown: (date) =>
              date.toLocaleString("default", { month: "long" }),
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
