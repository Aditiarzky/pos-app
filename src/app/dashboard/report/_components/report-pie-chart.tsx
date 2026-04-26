"use client";

import * as React from "react";
import { Label, Pie, PieChart, Cell } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/format";
import { BUSINESS_TERMS } from "@/lib/business-terms";

interface ReportPieChartProps {
  data: {
    productName: string;
    revenue: number;
  }[];
  title?: string;
  description?: string;
}

// Distinct categorical colors that work well in both light/dark themes
const DISTINCT_COLORS = [
  "hsl(217, 91%, 60%)", // Blue
  "hsl(142, 71%, 45%)", // Emerald
  "hsl(31, 97%, 55%)", // Orange/Amber
  "hsl(262, 83%, 58%)", // Violet
  "hsl(346, 84%, 61%)", // Rose/Pink
];

export function ReportPieChart({
  data,
  title = `${BUSINESS_TERMS.revenueShort} per Produk`,
  description = "Kontribusi produk teratas",
}: ReportPieChartProps) {
  const chartData = React.useMemo(() => {
    return data.map((item, index) => ({
      name: item.productName,
      revenue: item.revenue,
      fill: DISTINCT_COLORS[index % DISTINCT_COLORS.length],
    }));
  }, [data]);

  const totalRevenue = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.revenue, 0);
  }, [data]);

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      revenue: {
        label: BUSINESS_TERMS.revenueShort,
      },
    };
    data.forEach((item, index) => {
      config[item.productName] = {
        label: item.productName,
        color: DISTINCT_COLORS[index % DISTINCT_COLORS.length],
      };
    });
    return config;
  }, [data]);

  if (data.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0 pt-6">
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0 flex items-center justify-center min-h-[250px] text-muted-foreground text-sm italic">
          Belum ada data tersedia pada periode ini
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full shadow-md p-0">
      <CardHeader className="items-center pb-0 pt-6 border-b bg-muted/20">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0 pt-4">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="revenue"
              nameKey="name"
              innerRadius={60}
              strokeWidth={5}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-lg font-bold"
                        >
                          {formatCurrency(totalRevenue)}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-[10px] font-medium"
                        >
                          Kontribusi {BUSINESS_TERMS.revenueShort}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 p-5 border-t bg-muted/5">
        <div className="grid grid-cols-1 gap-1.5 w-full">
          {chartData.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-[11px] font-medium text-muted-foreground truncate">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[11px] font-bold tabular-nums">
                  {((item.revenue / totalRevenue) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}
