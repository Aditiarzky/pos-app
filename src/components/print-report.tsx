/**
 * print-report.tsx  —  @/components/print-report.tsx
 *
 * Single-page A4 print layout. No page-break tricks needed — everything
 * fits in one page using a compact 2-column design.
 *
 * Layout (A4 portrait, ~257mm usable height):
 * ┌─────────────────────────────────────┐
 * │ Header: Judul + Periode + Tanggal   │  ~18mm
 * ├──────────────────┬──────────────────┤
 * │ Ikhtisar (2-col) │                  │  ~22mm
 * ├──────────────────┴──────────────────┤
 * │ Top Produk (kiri) │ Top Kategori +  │
 * │                   │ Laba Rugi (kanan│  ~120mm
 * ├───────────────────┴─────────────────┤
 * │ Mini spark-line chart (full width)  │  ~70mm
 * └─────────────────────────────────────┘
 */

import React from "react";
import { formatCurrency } from "@/lib/format";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Summary {
  totalSales?: number;
  totalPurchases?: number;
  totalTransactions?: number;
  netCashFlow?: number;
  netProfit?: number;
}

interface TopProduct {
  productId: string | number;
  productName: string;
  qtySold: number;
  revenue: number;
}

interface TopCategory {
  categoryId: string | number;
  categoryName: string;
  qtySold: number;
  revenue: number;
}

interface DailyRow {
  date: string;
  totalSales?: number | string;
  totalPurchases?: number | string;
}

interface BreakdownRow {
  type: string;
  name: string;
  amount: number;
}

interface PrintReportProps {
  appliedFilter: { startDate: string; endDate: string };
  summary?: Summary;
  topProducts: TopProduct[];
  topCategories: TopCategory[];
  dailyData: DailyRow[];
  breakdownRows: BreakdownRow[];
}

// ── Mini sparkline ────────────────────────────────────────────────────────────

function Sparkline({
  data,
  salesKey,
  purchaseKey,
}: {
  data: DailyRow[];
  salesKey: keyof DailyRow;
  purchaseKey: keyof DailyRow;
}) {
  if (!data.length) return null;

  const W = 680;
  const H = 90;
  const PL = 46,
    PR = 8,
    PT = 10,
    PB = 28;
  const cW = W - PL - PR;
  const cH = H - PT - PB;
  const cBottom = PT + cH;

  const sales = data.map((d) => Number(d[salesKey] ?? 0));
  const purchase = data.map((d) => Number(d[purchaseKey] ?? 0));
  const maxVal = Math.max(...sales, ...purchase, 1);
  const mag = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const ceil = Math.ceil(maxVal / mag) * mag;

  const xOf = (i: number) =>
    PL + (data.length === 1 ? cW / 2 : (i / (data.length - 1)) * cW);
  const yOf = (v: number) => cBottom - (v / ceil) * cH;

  const pts = (vals: number[]) =>
    vals.map((v, i) => `${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(" ");

  const area = (vals: number[]) => {
    const xs = vals.map((_, i) => xOf(i));
    const ys = vals.map(yOf);
    return `M ${xs[0].toFixed(1)},${cBottom} L ${xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" L ")} L ${xs[xs.length - 1].toFixed(1)},${cBottom} Z`;
  };

  const fmtY = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}Jt`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return String(v);
  };

  const step = Math.ceil(data.length / 10);
  const xLabels = data
    .map((_, i) => i)
    .filter((i) => i % step === 0 || i === data.length - 1);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t, i) => ({
    val: Math.round(ceil * t),
    i,
  }));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="auto"
      style={{ display: "block" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#18181b" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#18181b" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#71717a" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#71717a" stopOpacity="0" />
        </linearGradient>
      </defs>

      {yTicks.map(({ val, i }) => (
        <g key={i}>
          <line
            x1={PL}
            y1={yOf(val)}
            x2={PL + cW}
            y2={yOf(val)}
            stroke={val === 0 ? "#a1a1aa" : "#e4e4e7"}
            strokeWidth={val === 0 ? 1 : 0.5}
            strokeDasharray={val === 0 ? undefined : "2 2"}
          />
          <text
            x={PL - 4}
            y={yOf(val) + 3}
            textAnchor="end"
            fontSize={7}
            fill="#a1a1aa"
          >
            {fmtY(val)}
          </text>
        </g>
      ))}

      <path d={area(purchase)} fill="url(#gP)" />
      <path d={area(sales)} fill="url(#gS)" />
      <polyline
        points={pts(purchase)}
        fill="none"
        stroke="#a1a1aa"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <polyline
        points={pts(sales)}
        fill="none"
        stroke="#18181b"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />

      {xLabels.map((i) => (
        <text
          key={i}
          x={xOf(i)}
          y={cBottom + 11}
          textAnchor="middle"
          fontSize={6.5}
          fill="#a1a1aa"
        >
          {(data[i].date as string).slice(5)}
        </text>
      ))}

      <line
        x1={PL}
        y1={cBottom}
        x2={PL + cW}
        y2={cBottom}
        stroke="#d4d4d8"
        strokeWidth={0.8}
      />

      {/* legend */}
      <rect x={PL} y={H - 7} width={8} height={3} fill="#18181b" rx={1} />
      <text
        x={PL + 10}
        y={H - 4}
        fontSize={6.5}
        fill="#18181b"
        fontWeight={600}
      >
        Penjualan
      </text>
      <rect x={PL + 70} y={H - 7} width={8} height={3} fill="#a1a1aa" rx={1} />
      <text
        x={PL + 82}
        y={H - 4}
        fontSize={6.5}
        fill="#71717a"
        fontWeight={600}
      >
        Pembelian
      </text>
    </svg>
  );
}

// ── Shared cell styles ────────────────────────────────────────────────────────

const TH: React.CSSProperties = {
  fontSize: "7.5px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.3px",
  padding: "3px 5px",
  border: "1px solid #d4d4d8",
  background: "#f4f4f5",
  WebkitPrintColorAdjust: "exact",
  printColorAdjust: "exact",
};

const TD: React.CSSProperties = {
  fontSize: "8.5px",
  padding: "2.5px 5px",
  border: "1px solid #e4e4e7",
  verticalAlign: "top",
};

const SECTION_TITLE: React.CSSProperties = {
  fontSize: "7.5px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  margin: "0 0 3px",
  padding: "2px 5px",
  background: "#f4f4f5",
  borderLeft: "2px solid #18181b",
  WebkitPrintColorAdjust: "exact",
  printColorAdjust: "exact",
};

const TABLE: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
};

// ── Main component ────────────────────────────────────────────────────────────

export function PrintReport({
  appliedFilter,
  summary,
  topProducts,
  topCategories,
  dailyData,
  breakdownRows,
}: PrintReportProps) {
  return (
    <div
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        color: "#18181b",
        fontSize: "8.5px",
        lineHeight: 1.3,
        // A4 usable area at screen resolution — print CSS handles actual sizing
        width: "100%",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          marginBottom: "8px",
          paddingBottom: "6px",
          borderBottom: "1.5px solid #18181b",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 800,
                letterSpacing: "-0.3px",
              }}
            >
              Laporan Bisnis
            </div>
            <div style={{ fontSize: "8px", color: "#52525b" }}>
              Periode: {appliedFilter.startDate} s/d {appliedFilter.endDate}
            </div>
          </div>
          <div
            style={{ fontSize: "8px", color: "#71717a", textAlign: "right" }}
          >
            Dicetak:{" "}
            {new Date().toLocaleString("id-ID", {
              dateStyle: "long",
              timeStyle: "short",
            })}
          </div>
        </div>
      </div>

      {/* ── Ikhtisar (2-col grid) ── */}
      <div style={{ marginBottom: "8px" }}>
        <p style={SECTION_TITLE}>Ikhtisar Performa</p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "2px 12px",
          }}
        >
          {[
            ["Total Penjualan", formatCurrency(summary?.totalSales ?? 0)],
            ["Total Pembelian", formatCurrency(summary?.totalPurchases ?? 0)],
            [
              "Total Transaksi",
              (summary?.totalTransactions ?? 0).toLocaleString("id-ID"),
            ],
            ["Arus Kas Bersih", formatCurrency(summary?.netCashFlow ?? 0)],
            ["Estimasi Laba Bersih", formatCurrency(summary?.netProfit ?? 0)],
          ].map(([lbl, val]) => (
            <div
              key={lbl}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "8.5px",
                padding: "2px 0",
                borderBottom: "1px dotted #d4d4d8",
              }}
            >
              <span style={{ color: "#52525b" }}>{lbl}</span>
              <span style={{ fontWeight: 700 }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2-column: Top Produk (left) + Top Kategori & Laba Rugi (right) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0 12px",
          marginBottom: "8px",
        }}
      >
        {/* Left: Top Produk */}
        <div>
          <p style={SECTION_TITLE}>Top Produk</p>
          <table style={TABLE}>
            <thead>
              <tr>
                <th style={{ ...TH, width: "20px" }}>#</th>
                <th style={TH}>Produk</th>
                <th style={{ ...TH, width: "32px", textAlign: "right" }}>
                  Qty
                </th>
                <th style={{ ...TH, width: "64px", textAlign: "right" }}>
                  Pendapatan
                </th>
              </tr>
            </thead>
            <tbody>
              {topProducts.slice(0, 20).map((p, i) => (
                <tr
                  key={p.productId}
                  style={{
                    background: i % 2 === 1 ? "#fafafa" : "white",
                    WebkitPrintColorAdjust: "exact",
                    printColorAdjust: "exact",
                  }}
                >
                  <td style={{ ...TD, textAlign: "center" }}>{i + 1}</td>
                  <td style={{ ...TD, wordBreak: "break-word" }}>
                    {p.productName}
                  </td>
                  <td style={{ ...TD, textAlign: "right" }}>
                    {p.qtySold.toLocaleString("id-ID")}
                  </td>
                  <td style={{ ...TD, textAlign: "right" }}>
                    {formatCurrency(p.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right: Top Kategori + Laba Rugi */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {/* Top Kategori */}
          <div>
            <p style={SECTION_TITLE}>Top Kategori</p>
            <table style={TABLE}>
              <thead>
                <tr>
                  <th style={{ ...TH, width: "20px" }}>#</th>
                  <th style={TH}>Kategori</th>
                  <th style={{ ...TH, width: "32px", textAlign: "right" }}>
                    Qty
                  </th>
                  <th style={{ ...TH, width: "64px", textAlign: "right" }}>
                    Pendapatan
                  </th>
                </tr>
              </thead>
              <tbody>
                {topCategories.slice(0, 15).map((cat, i) => (
                  <tr
                    key={cat.categoryId}
                    style={{
                      background: i % 2 === 1 ? "#fafafa" : "white",
                      WebkitPrintColorAdjust: "exact",
                      printColorAdjust: "exact",
                    }}
                  >
                    <td style={{ ...TD, textAlign: "center" }}>{i + 1}</td>
                    <td style={{ ...TD }}>{cat.categoryName}</td>
                    <td style={{ ...TD, textAlign: "right" }}>
                      {cat.qtySold.toLocaleString("id-ID")}
                    </td>
                    <td style={{ ...TD, textAlign: "right" }}>
                      {formatCurrency(cat.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Laba Rugi */}
          <div>
            <p style={SECTION_TITLE}>Laba Rugi — Rincian Potongan</p>
            <table style={TABLE}>
              <thead>
                <tr>
                  <th style={TH}>Jenis</th>
                  <th style={TH}>Nama</th>
                  <th style={{ ...TH, width: "64px", textAlign: "right" }}>
                    Nominal
                  </th>
                </tr>
              </thead>
              <tbody>
                {breakdownRows.slice(0, 20).map((row, i) => (
                  <tr
                    key={i}
                    style={{
                      background: i % 2 === 1 ? "#fafafa" : "white",
                      WebkitPrintColorAdjust: "exact",
                      printColorAdjust: "exact",
                    }}
                  >
                    <td style={{ ...TD, width: "80px" }}>{row.type}</td>
                    <td style={TD}>{row.name}</td>
                    <td style={{ ...TD, textAlign: "right" }}>
                      {formatCurrency(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td
                    colSpan={2}
                    style={{
                      ...TD,
                      fontWeight: 700,
                      borderTop: "1.5px solid #18181b",
                    }}
                  >
                    Estimasi Laba Bersih
                  </td>
                  <td
                    style={{
                      ...TD,
                      fontWeight: 700,
                      textAlign: "right",
                      borderTop: "1.5px solid #18181b",
                    }}
                  >
                    {formatCurrency(summary?.netProfit ?? 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* ── Chart sparkline (full width, compact) ── */}
      <div>
        <p style={SECTION_TITLE}>Tren Penjualan &amp; Pembelian Harian</p>
        <Sparkline
          data={dailyData}
          salesKey="totalSales"
          purchaseKey="totalPurchases"
        />
      </div>
    </div>
  );
}
