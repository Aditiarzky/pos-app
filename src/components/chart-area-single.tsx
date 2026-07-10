"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export interface ChartSingleData {
  date: string;
  [key: string]: string | number;
}

interface ChartAreaSingleProps {
  data: ChartSingleData[];
  dataKey: string;
  label: string;
  color: string;
  title?: string;
  description?: string;
}

/**
 * Simplified area chart for a SINGLE data series.
 * Unlike ChartAreaInteractive (multi-series), this component computes its
 * own Y-axis max in plain JS instead of relying on recharts' function-based
 * domain, so there's no risk of NaN/mis-parsed args when only one series
 * is present.
 */
export function ChartAreaSingle({
  data,
  dataKey,
  label,
  color,
  title = "Analytic Chart",
  description = "Showing data for the selected period",
}: ChartAreaSingleProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const config: ChartConfig = {
    [dataKey]: { label, color },
  };

  // Compute a safe Y-axis max ourselves — avoids recharts' domain function
  // quirks (wrong arg order, NaN when data is empty) entirely.
  const yMax = React.useMemo(() => {
    const values = data
      .map((item) => Number(item[dataKey]))
      .filter((v) => Number.isFinite(v));

    const max = values.length > 0 ? Math.max(...values) : 0;

    if (!Number.isFinite(max) || max <= 0) return 1;
    return Math.ceil(max * 1.1);
  }, [data, dataKey]);

  return (
    <Card className="@container/card">
      <CardHeader>
        <div className="flex flex-col gap-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          key={data.length > 0 ? "has-data" : "no-data"}
          config={config}
          className="aspect-auto h-[300px] w-full overflow-visible"
        >
          {mounted ? (
            <AreaChart
              data={data}
              margin={{
                left: 12,
                right: 12,
                top: 20,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient
                  id={`fill${dataKey}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={`var(--color-${dataKey})`}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={`var(--color-${dataKey})`}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                opacity={0.4}
                stroke="var(--border)"
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      });
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey={dataKey}
                type="monotone"
                baseValue={0}
                fill={`url(#fill${dataKey})`}
                stroke={`var(--color-${dataKey})`}
                strokeWidth={2}
              />
              <YAxis hide domain={[0, yMax]} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("id-ID", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
            </AreaChart>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
