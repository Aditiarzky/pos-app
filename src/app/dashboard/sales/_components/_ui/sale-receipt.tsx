"use client";

import { SaleResponse } from "../../_types/sale-type";
import { formatCurrency, formatDate } from "@/lib/format";
import Barcode from "react-barcode";
import { forwardRef } from "react";

interface SaleReceiptProps {
  sale: SaleResponse;
}

/**
 * Receipt component pakai inline styles agar kompatibel dengan react-to-print.
 * Tailwind CSS tidak ter-copy ke print iframe, jadi harus pakai inline.
 */
export const SaleReceipt = forwardRef<HTMLDivElement, SaleReceiptProps>(
  function SaleReceipt({ sale }, ref) {
    // Shared styles
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

        {/* Sale Info */}
        <div style={{ fontSize: "10px" }}>
          <div style={flexBetween}>
            <span>No: {sale.invoiceNumber}</span>
            <span>{formatDate(sale.createdAt || new Date())}</span>
          </div>
          <div style={flexBetween}>
            <span>Kasir: {sale.user?.name?.split(" ")[0] || "Admin"}</span>
            <span>Customer: {sale.customer?.name || "Guest"}</span>
          </div>
        </div>

        {/* Barcode */}
        <div
          style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}
        >
          <Barcode
            value={sale.invoiceNumber}
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

        {/* Items */}
        <div>
          {sale.items?.map((item, idx) => (
            <div
              key={item.id}
              style={{
                marginBottom: idx < (sale.items?.length || 0) - 1 ? "6px" : "0",
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
                {item.product?.name}
              </span>
              <div style={{ ...flexBetween, fontSize: "10px" }}>
                <span>
                  {Number(item.qty).toFixed(0)} x{" "}
                  {formatCurrency(Number(item.priceAtSale))}
                </span>
                <span>{formatCurrency(Number(item.subtotal))}</span>
              </div>
              {item.productVariant?.name && (
                <span
                  style={{
                    fontSize: "9px",
                    fontStyle: "italic",
                    opacity: 0.7,
                  }}
                >
                  Var: {item.productVariant?.name}
                </span>
              )}
            </div>
          ))}
        </div>

        <div style={dashedBorder} />

        {/* Totals */}
        <div style={{ fontSize: "10px" }}>
          <div style={flexBetween}>
            <span>Subtotal</span>
            <span>{formatCurrency(Number(sale.totalPrice))}</span>
          </div>

          {Number(sale.totalBalanceUsed) > 0 && (
            <div
              style={{ ...flexBetween, fontWeight: 700, fontStyle: "italic" }}
            >
              <span>Voucher/Saldo</span>
              <span>-{formatCurrency(Number(sale.totalBalanceUsed))}</span>
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
            <span>TOTAL</span>
            <span>
              {formatCurrency(
                Number(sale.totalPrice) - Number(sale.totalBalanceUsed),
              )}
            </span>
          </div>

          <div style={{ ...flexBetween, paddingTop: "4px" }}>
            <span>Bayar</span>
            <span>{formatCurrency(Number(sale.totalPaid))}</span>
          </div>

          {sale.status === "debt" ? (
            <div
              style={{
                ...flexBetween,
                fontWeight: 700,
                borderLeft: "2px solid #000",
                paddingLeft: "4px",
              }}
            >
              <span>Sisa Hutang</span>
              <span>
                {formatCurrency(Math.abs(Number(sale.debt?.remainingAmount)))}
              </span>
            </div>
          ) : (
            <div style={flexBetween}>
              <span>Kembali</span>
              <span>{formatCurrency(Number(sale.totalReturn))}</span>
            </div>
          )}
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
            Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.
          </p>
        </div>
      </div>
    );
  },
);
