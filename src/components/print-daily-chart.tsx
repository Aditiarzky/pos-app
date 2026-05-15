/**
 * print-daily-chart.tsx  —  @/components/print-daily-chart.tsx
 *
 * Pure SVG line-area chart for the print layout.
 * Uses the same two-div page-break pattern as PrintTable for reliability.
 */

import React from "react";

interface DailyRow {
  date: string;
  totalSales?: number | string;
  totalPurchases?: number | string;
}

interface PrintDailyChartProps {
  title: string;
  data: DailyRow[];
  forcePageBreak?: boolean;
}

const n = (v: number | string | undefined) => Number(v ?? 0);

function fmtShort(v: number): string {
  if (v === 0) return "0";
  if (v >= 1_000_000_000)
    return `${(v / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 1_000_000)
    return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}Jt`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

function toPoints(xs: number[], ys: number[]): string {
  return xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
}

function toAreaPath(xs: number[], ys: number[], chartBottom: number): string {
  if (xs.length === 0) return "";
  const pts = xs
    .map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`)
    .join(" L ");
  return `M ${xs[0].toFixed(1)},${chartBottom} L ${pts} L ${xs[xs.length - 1].toFixed(1)},${chartBottom} Z`;
}

export function PrintDailyChart({
  title,
  data,
  forcePageBreak = true,
}: PrintDailyChartProps) {
  if (!data || data.length === 0) return null;

  const W = 724;
  const H = 310;
  const PAD = { top: 24, right: 16, bottom: 52, left: 72 };

  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const chartBottom = PAD.top + chartH;

  const sales = data.map((d) => n(d.totalSales));
  const purchase = data.map((d) => n(d.totalPurchases));
  const allVals = [...sales, ...purchase];
  const maxVal = Math.max(...allVals, 1);

  const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const niceCeil = Math.ceil(maxVal / magnitude) * magnitude;
  const Y_TICKS = 5;

  const xOf = (i: number) =>
    PAD.left +
    (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW);

  const yOf = (v: number) => chartBottom - (v / niceCeil) * chartH;

  const xArr = data.map((_, i) => xOf(i));
  const ySales = sales.map(yOf);
  const yPurchase = purchase.map(yOf);

  const MAX_X_LABELS = 12;
  const step = Math.ceil(data.length / MAX_X_LABELS);
  const xLabelIndices = data
    .map((_, i) => i)
    .filter((i) => i % step === 0 || i === data.length - 1);

  const yTickValues = Array.from({ length: Y_TICKS + 1 }, (_, i) =>
    Math.round((niceCeil / Y_TICKS) * i),
  );

  return (
    // Outer: page-break signal only
    <div
      style={{
        display: "block",
        margin: 0,
        padding: 0,
        pageBreakBefore: forcePageBreak ? "always" : "auto",
        breakBefore: forcePageBreak ? "page" : "auto",
      }}
    >
      {/* Inner: break-inside avoid */}
      <div
        style={{
          display: "block",
          breakInside: "avoid",
          pageBreakInside: "avoid",
        }}
      >
        <p
          style={{
            fontSize: "10px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            margin: "0 0 10px 0",
            padding: "4px 7px",
            background: "#f4f4f5",
            borderLeft: "3px solid #18181b",
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
            display: "block",
          }}
        >
          {title}
        </p>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height="auto"
          style={{ display: "block", overflow: "visible" }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#18181b" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#18181b" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="gradPurchase" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#71717a" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#71717a" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {yTickValues.map((val, idx) => {
            const y = yOf(val);
            return (
              <g key={`y-tick-${idx}-${val}`}>
                <line
                  x1={PAD.left}
                  y1={y}
                  x2={PAD.left + chartW}
                  y2={y}
                  stroke={val === 0 ? "#a1a1aa" : "#e4e4e7"}
                  strokeWidth={val === 0 ? 1 : 0.5}
                  strokeDasharray={val === 0 ? undefined : "3 3"}
                />
                <text
                  x={PAD.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize={8}
                  fill="#71717a"
                >
                  {fmtShort(val)}
                </text>
              </g>
            );
          })}

          <text
            x={10}
            y={PAD.top + chartH / 2}
            textAnchor="middle"
            fontSize={8}
            fill="#a1a1aa"
            transform={`rotate(-90, 10, ${PAD.top + chartH / 2})`}
          >
            Rupiah
          </text>

          <path
            d={toAreaPath(xArr, yPurchase, chartBottom)}
            fill="url(#gradPurchase)"
          />
          <path
            d={toAreaPath(xArr, ySales, chartBottom)}
            fill="url(#gradSales)"
          />

          <polyline
            points={toPoints(xArr, yPurchase)}
            fill="none"
            stroke="#a1a1aa"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <polyline
            points={toPoints(xArr, ySales)}
            fill="none"
            stroke="#18181b"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {data.length <= 31 &&
            xArr.map((x, i) => (
              <g key={i}>
                <circle cx={x} cy={ySales[i]} r={2.5} fill="#18181b" />
                <circle cx={x} cy={yPurchase[i]} r={2} fill="#71717a" />
              </g>
            ))}

          {xLabelIndices.map((i) => {
            const raw = data[i].date as string;
            const label = raw.length === 10 ? raw.slice(5) : raw;
            return (
              <text
                key={i}
                x={xOf(i)}
                y={chartBottom + 14}
                textAnchor="middle"
                fontSize={7.5}
                fill="#71717a"
                transform={
                  data.length > 60
                    ? `rotate(-45, ${xOf(i)}, ${chartBottom + 14})`
                    : undefined
                }
              >
                {label}
              </text>
            );
          })}

          <line
            x1={PAD.left}
            y1={chartBottom}
            x2={PAD.left + chartW}
            y2={chartBottom}
            stroke="#a1a1aa"
            strokeWidth={1}
          />

          <g transform={`translate(${PAD.left}, ${H - 14})`}>
            <rect x={0} y={-6} width={10} height={4} fill="#18181b" rx={1} />
            <text x={14} y={0} fontSize={8} fill="#18181b" fontWeight={600}>
              Penjualan
            </text>
            <rect x={90} y={-6} width={10} height={4} fill="#a1a1aa" rx={1} />
            <text x={104} y={0} fontSize={8} fill="#71717a" fontWeight={600}>
              Pembelian
            </text>
          </g>
        </svg>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4px 20px",
            marginTop: "8px",
            paddingTop: "8px",
            borderTop: "1px solid #e4e4e7",
          }}
        >
          {[
            ["Total Penjualan", sales.reduce((a, b) => a + b, 0)],
            ["Total Pembelian", purchase.reduce((a, b) => a + b, 0)],
          ].map(([lbl, val]) => (
            <div
              key={String(lbl)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "10px",
                padding: "3px 0",
                borderBottom: "1px dotted #d4d4d8",
              }}
            >
              <span style={{ color: "#52525b" }}>{String(lbl)}</span>
              <span style={{ fontWeight: 700 }}>
                Rp {Number(val).toLocaleString("id-ID")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
