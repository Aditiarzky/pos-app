/**
 * print-table.tsx  —  @/components/print-table.tsx
 *
 * STRATEGY: Split rows into page-sized chunks. Each chunk is a separate
 * <table> inside a <div> that is guaranteed to fit one A4 page.
 *
 * break-before / page-break-before is set on a DEDICATED wrapper div
 * that has zero margin/padding and display:block — browsers reliably
 * honour page-break-before on such elements.
 *
 * forcePageBreak (default: true) — every section starts on a fresh page.
 */

import React from "react";

export interface PrintColumn<T> {
  header: string;
  key: keyof T | "idx";
  width?: number;
  align?: "left" | "right" | "center";
  format?: (value: unknown, row: T) => React.ReactNode;
}

export interface PrintTableProps<T extends Record<string, unknown>> {
  title: string;
  columns: PrintColumn<T>[];
  rows: T[];
  footerRow?: React.ReactNode[];
  rowHeightPx?: number;
  headerHeightPx?: number;
  pageHeightPx?: number;
  forcePageBreak?: boolean;
}

function chunkRows<T>(
  rows: T[],
  rowH: number,
  headerH: number,
  pageH: number,
): T[][] {
  const rowsPerPage = Math.max(1, Math.floor((pageH - headerH) / rowH));
  const chunks: T[][] = [];
  for (let i = 0; i < rows.length; i += rowsPerPage) {
    chunks.push(rows.slice(i, i + rowsPerPage));
  }
  return chunks.length ? chunks : [[]];
}

// Shared print styles as inline objects (avoids any CSS class interference)
const TITLE_STYLE: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  margin: "0 0 5px 0",
  padding: "4px 7px",
  background: "#f4f4f5",
  borderLeft: "3px solid #18181b",
  WebkitPrintColorAdjust: "exact",
  printColorAdjust: "exact",
  display: "block",
};

const TH_STYLE: React.CSSProperties = {
  background: "#f4f4f5",
  WebkitPrintColorAdjust: "exact",
  printColorAdjust: "exact",
  fontSize: "9px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.4px",
  padding: "5px 7px",
  border: "1px solid #d4d4d8",
  textAlign: "left",
};

export function PrintTable<T extends Record<string, unknown>>({
  title,
  columns,
  rows,
  footerRow,
  rowHeightPx = 20,
  headerHeightPx = 56,
  pageHeightPx = 980,
  forcePageBreak = true,
}: PrintTableProps<T>) {
  const chunks = chunkRows(rows, rowHeightPx, headerHeightPx, pageHeightPx);
  const rowsPerPage = Math.max(
    1,
    Math.floor((pageHeightPx - headerHeightPx) / rowHeightPx),
  );

  return (
    <>
      {chunks.map((chunk, ci) => {
        const doBreak = ci > 0 || forcePageBreak;

        return (
          // Outer wrapper: ONLY job is to carry the page-break signal.
          // Zero margin, zero padding, display:block — browsers treat this
          // reliably for page-break-before.
          <div
            key={ci}
            style={{
              display: "block",
              margin: 0,
              padding: 0,
              pageBreakBefore: doBreak ? "always" : "auto",
              breakBefore: doBreak ? "page" : "auto",
            }}
          >
            {/* Inner wrapper: carries break-inside avoid */}
            <div
              style={{
                display: "block",
                breakInside: "avoid",
                pageBreakInside: "avoid",
              }}
            >
              <p style={TITLE_STYLE}>
                {title}
                {chunks.length > 1 && (
                  <span
                    style={{ fontWeight: 400, marginLeft: 6, color: "#71717a" }}
                  >
                    ({ci + 1}/{chunks.length})
                  </span>
                )}
              </p>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "10px",
                  tableLayout: "fixed",
                }}
              >
                <thead style={{ display: "table-header-group" }}>
                  <tr>
                    {columns.map((col, j) => (
                      <th
                        key={j}
                        style={{
                          ...TH_STYLE,
                          textAlign: col.align ?? "left",
                          width: col.width ? `${col.width}px` : undefined,
                        }}
                      >
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {chunk.map((row, ri) => (
                    <tr
                      key={ri}
                      style={{
                        background: ri % 2 === 1 ? "#fafafa" : "white",
                        WebkitPrintColorAdjust: "exact",
                        printColorAdjust: "exact",
                      }}
                    >
                      {columns.map((col, j) => {
                        const rawVal =
                          col.key === "idx"
                            ? ci * rowsPerPage + ri + 1
                            : row[col.key as keyof T];
                        const display = col.format
                          ? col.format(rawVal, row)
                          : String(rawVal ?? "");
                        return (
                          <td
                            key={j}
                            style={{
                              padding: "4px 7px",
                              border: "1px solid #e4e4e7",
                              fontSize: "10px",
                              textAlign: col.align ?? "left",
                              verticalAlign: "top",
                              wordBreak: "break-word",
                            }}
                          >
                            {display}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>

                {footerRow && ci === chunks.length - 1 && (
                  <tfoot style={{ display: "table-footer-group" }}>
                    <tr>
                      {footerRow.map((cell, fi) => (
                        <td
                          key={fi}
                          style={{
                            padding: "5px 7px",
                            fontWeight: 700,
                            borderTop: "2px solid #18181b",
                            textAlign: columns[fi]?.align ?? "left",
                          }}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        );
      })}
    </>
  );
}
