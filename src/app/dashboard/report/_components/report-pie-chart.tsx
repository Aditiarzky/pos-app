"use client";

import * as React from "react";
import { Label, Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/format";

interface ReportPieChartProps {
  data: {
    productName: string;
    revenue: number;
  }[];
  title?: string;
  description?: string;
}

export function ReportPieChart({
  data,
  title = "Revenue by Product",
  description = "Top products contribution",
}: ReportPieChartProps) {
  const chartData = React.useMemo(() => {
    return data.map((item, index) => ({
      name: item.productName,
      revenue: item.revenue,
      fill: `var(--chart-${(index % 5) + 1})`,
    }));
  }, [data]);

  const totalRevenue = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.revenue, 0);
  }, [data]);

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      revenue: {
        label: "Revenue",
      },
    };
    data.forEach((item, index) => {
      config[item.productName] = {
        label: item.productName,
        color: `var(--chart-${(index % 5) + 1})`,
      };
    });
    return config;
  }, [data]);

  if (data.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0 flex items-center justify-center min-h-[200px] text-muted-foreground text-sm italic">
          No data available for this period
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
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
                          {formatCurrency(totalRevenue)
                            .replace("Rp", "")
                            .trim()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-xs"
                        >
                          Total Revenue (Rp)
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
    </Card>
  );
}
