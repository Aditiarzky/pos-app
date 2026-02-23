"use client";

import { formatCurrency, formatDate } from "@/lib/format";
import { forwardRef } from "react";
import { ReturnResult } from "../../_hooks/use-return-form";
import Barcode from "react-barcode";

interface ReturnReceiptProps {
  result: ReturnResult;
}

/**
 * Return receipt component — inline styles for react-to-print compatibility.
 * Consistent style with SaleReceipt.
 */
export const ReturnReceipt = forwardRef<HTMLDivElement, ReturnReceiptProps>(
  function ReturnReceipt({ result }, ref) {
    const fontMono =
      "'Courier New', Courier, 'Lucida Console', Monaco, monospace";
    const dashedBorder: React.CSSProperties = {
      borderTop: "1px dashed #000",
      width: "100%",
      margin: "8px 0",
    };
    const flexBetween: React.CSSProperties = {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
    };

    const compensationLabel =
      result.compensationType === "refund"
        ? "REFUND TUNAI"
        : result.compensationType === "credit_note"
          ? "UR: CREDIT NOTE"
          : "TUKAR BARANG";

    return (
      <div
        ref={ref}
        className="print-content"
        style={{
          margin: "0 auto",
          padding: "4px 8px",
          backgroundColor: "#fff",
          color: "#000",
          fontFamily: fontMono,
          fontSize: "11px",
          lineHeight: "1.35",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", paddingTop: "4px" }}>
          <h2
            style={{
              fontSize: "14px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "-0.5px",
              margin: "0 0 2px 0",
            }}
          >
            TOKO ADITIARZKY
          </h2>
          <p style={{ fontSize: "9px", margin: "1px 0" }}>
            Jl. Raya No. 123, Kota ABC
          </p>
          <p style={{ fontSize: "9px", margin: "1px 0" }}>
            Telp: 0812-3456-7890
          </p>
        </div>

        <div style={dashedBorder} />

        {/* Return Label */}
        <div
          style={{
            textAlign: "center",
            fontWeight: 900,
            fontSize: "14px",
            textTransform: "uppercase",
            letterSpacing: "2px",
            padding: "4px 0",
            border: "2px solid #000",
            margin: "4px 0",
          }}
        >
          NOTA RETUR
        </div>

        <div style={dashedBorder} />

        {/* Return Info */}
        <div style={{ fontSize: "10px" }}>
          <div style={flexBetween}>
            <span>No: {result.returnNumber}</span>
            <span>{formatDate(new Date())}</span>
          </div>
          <div style={flexBetween}>
            <span>Invoice: {result.saleData.invoiceNumber}</span>
            <span>Tipe: {compensationLabel}</span>
          </div>
          <div style={flexBetween}>
            <span>Customer: {result.customerName || "Guest"}</span>
          </div>
        </div>

        {/* Barcode */}
        <div
          style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}
        >
          <Barcode
            value={result.returnNumber}
            format="CODE128"
            width={1.8}
            height={45}
            fontSize={10}
            lineColor="#000"
            background="#fff"
            textMargin={4}
            renderer="svg"
          />
        </div>

        <div style={dashedBorder} />

        {/* Return Items */}
        <div>
          <p
            style={{
              fontWeight: 700,
              fontSize: "10px",
              textTransform: "uppercase",
              marginBottom: "4px",
              letterSpacing: "1px",
            }}
          >
            BARANG DIRETUR:
          </p>
          {result.returnItems.map((item, idx) => (
            <div
              key={`ret-${idx}`}
              style={{
                marginBottom: idx < result.returnItems.length - 1 ? "6px" : "0",
              }}
            >
              <span
                style={{
                  textTransform: "uppercase",
                  fontWeight: 700,
                  display: "block",
                  lineHeight: "1.1",
                  marginBottom: "2px",
                }}
              >
                {item.productName}
              </span>
              <div style={{ ...flexBetween, fontSize: "10px" }}>
                <span>
                  {item.qty} x {formatCurrency(item.priceAtSale)}
                </span>
                <span>{formatCurrency(item.qty * item.priceAtSale)}</span>
              </div>
              <span
                style={{
                  fontSize: "9px",
                  fontStyle: "italic",
                  opacity: 0.7,
                }}
              >
                Var: {item.variantName}
                {item.returnedToStock ? " [✓ Restock]" : " [✗ Waste]"}
              </span>
            </div>
          ))}
        </div>

        <div style={dashedBorder} />

        {/* Exchange Items (if any) */}
        {result.exchangeItems.length > 0 && (
          <>
            <div>
              <p
                style={{
                  fontWeight: 700,
                  fontSize: "10px",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                  letterSpacing: "1px",
                }}
              >
                BARANG PENGGANTI:
              </p>
              {result.exchangeItems.map((item, idx) => (
                <div
                  key={`exc-${idx}`}
                  style={{
                    marginBottom:
                      idx < result.exchangeItems.length - 1 ? "6px" : "0",
                  }}
                >
                  <span
                    style={{
                      textTransform: "uppercase",
                      fontWeight: 700,
                      display: "block",
                      lineHeight: "1.1",
                      marginBottom: "2px",
                    }}
                  >
                    {item.productName}
                  </span>
                  <div style={{ ...flexBetween, fontSize: "10px" }}>
                    <span>
                      {item.qty} x {formatCurrency(item.sellPrice)}
                    </span>
                    <span>{formatCurrency(item.qty * item.sellPrice)}</span>
                  </div>
                  <span
                    style={{
                      fontSize: "9px",
                      fontStyle: "italic",
                      opacity: 0.7,
                    }}
                  >
                    Var: {item.variantName}
                  </span>
                </div>
              ))}
            </div>
            <div style={dashedBorder} />
          </>
        )}

        {/* Totals */}
        <div style={{ fontSize: "10px" }}>
          <div style={flexBetween}>
            <span>Total Retur</span>
            <span>{formatCurrency(result.totalValueReturned)}</span>
          </div>

          {result.exchangeItems.length > 0 && (
            <div style={flexBetween}>
              <span>Total Exchange</span>
              <span>-{formatCurrency(result.totalValueExchange)}</span>
            </div>
          )}

          <div
            style={{
              ...flexBetween,
              fontWeight: 900,
              fontSize: "14px",
              paddingTop: "4px",
              borderTop: "1px solid #000",
              marginTop: "4px",
            }}
          >
            <span>
              {result.netRefundAmount >= 0 ? "KEMBALI" : "KEKURANGAN"}
            </span>
            <span>{formatCurrency(Math.abs(result.netRefundAmount))}</span>
          </div>
        </div>

        <div style={dashedBorder} />

        {/* Compensation Info */}
        <div
          style={{
            textAlign: "center",
            padding: "4px 0",
            fontSize: "10px",
          }}
        >
          <p style={{ fontWeight: 700, fontSize: "10px" }}>
            Kompensasi: {compensationLabel}
          </p>
        </div>

        <div style={dashedBorder} />

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: "8px",
            paddingBottom: "8px",
          }}
        >
          <p style={{ fontWeight: 700, fontSize: "10px", margin: "0 0 4px 0" }}>
            *** TERIMA KASIH ***
          </p>
          <p style={{ fontSize: "8px", lineHeight: "1.1", margin: 0 }}>
            Retur telah diproses sesuai kebijakan toko.
          </p>
        </div>
      </div>
    );
  },
);
