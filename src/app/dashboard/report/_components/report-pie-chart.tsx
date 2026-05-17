"use client";

import * as React from "react";
import { Cell, Label, Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// Dynamic chart config is now generated inside the component

interface ReportPieChartProps {
  data: { productName?: string; categoryName?: string; revenue: number }[];
  title: string;
  description: string;
}

const PIE_COLORS = ["#2563eb", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

export function ReportPieChart({
  data,
  title,
  description,
}: ReportPieChartProps) {
  const chartData = React.useMemo(() => {
    return data.slice(0, 5).map((item, index) => {
      const name = item.productName || item.categoryName || "Tanpa Nama";
      const colorKey = `slice-${index + 1}`;
      // Sanitize name for use as a CSS variable key if necessary,
      // but Shadcn handles most strings if mapped correctly.
      return {
        name,
        colorKey,
        revenue: item.revenue,
        fill: PIE_COLORS[index % PIE_COLORS.length],
      };
    });
  }, [data]);

  const config = React.useMemo(() => {
    const c: ChartConfig = {
      revenue: {
        label: "Pendapatan",
      },
    };
    chartData.forEach((item, index) => {
      c[item.colorKey] = {
        label: item.name,
        color: PIE_COLORS[index % PIE_COLORS.length],
      };
    });
    return c;
  }, [chartData]);

  const totalRevenue = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.revenue, 0);
  }, [chartData]);

  return (
    <Card className="flex flex-col p-0 shadow-md">
      <CardHeader className="items-center pb-0 border-b bg-muted/20">
        <CardTitle className="pt-6">{title}</CardTitle>
        <CardDescription className="pb-4">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={config}
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
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.colorKey}`} fill={entry.fill} />
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
                          className="fill-foreground text-xl font-bold"
                        >
                          Top 5
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-xs"
                        >
                          Produk
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="mx-auto mt-4 grid max-w-[320px] grid-cols-1 gap-2 pb-4">
          {chartData.map((item) => {
            const percentage =
              totalRevenue > 0
                ? ((item.revenue / totalRevenue) * 100).toFixed(1)
                : "0";
            return (
              <div
                key={`${item.colorKey}-${item.name}`}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="truncate text-muted-foreground">
                    {item.name}
                  </span>
                </div>
                <span className="font-medium tabular-nums text-xs">
                  {percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
